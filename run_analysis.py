"""
AEO brand positioning analysis
Uses geo_unif_preprocessed_final_polished.csv (GitHub 최신).
브랜드명 끝에 '안과'가 없으면 자동으로 부착합니다.

Usage:
  python run_analysis.py
  python run_analysis.py --data path/to/other.csv --output-dir results
"""
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.manifold import TSNE
from sklearn.metrics.pairwise import cosine_similarity


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--data',       default='geo_unif_preprocessed_final_polished.csv')
    p.add_argument('--output-dir', default='results')
    return p.parse_args()


def _append_eye_clinic(brand_str: str) -> str:
    """브랜드명 끝에 '안과'가 없으면 자동으로 붙임 (notebook 로직과 동일)."""
    if not brand_str or pd.isna(brand_str):
        return brand_str
    brands = [b.strip() for b in str(brand_str).split(',')]
    return ', '.join(
        b + '안과' if b and not b.endswith('안과') else b
        for b in brands
    )


def _load_csv(data_path: str) -> pd.DataFrame:
    for enc in ('utf-8-sig', 'utf-8', 'cp949', 'euc-kr'):
        try:
            df = pd.read_csv(data_path, encoding=enc)
            # verify Korean is readable
            sample = str(df.iloc[0, 0])
            if any(ord(c) > 0x3000 for c in sample):
                return df
            # fallback: just return if no other encoding works
            return df
        except (UnicodeDecodeError, Exception):
            continue
    raise RuntimeError(f"Could not read {data_path} with any supported encoding")


def _extract_brands(df: pd.DataFrame) -> pd.DataFrame:
    """Return a long-form dataframe with columns: 브랜드, procedure, 유형.

    Format detection priority:
      1. recommended_list  (comma-separated)   + query_type  → geo_supports_final_*.csv
      2. peers_json        (JSON array)         + attribute   → geo_decoupled_final_*.csv
      3. 언급된 브랜드      (comma-separated)   + 유형        → dummy_data.csv (legacy)
    """
    cols = set(df.columns)

    if 'recommended_list' in cols:
        # geo_unif / geo_supports format — apply "안과" auto-append
        df = df.dropna(subset=['recommended_list']).copy()
        df['recommended_list'] = df['recommended_list'].apply(_append_eye_clinic)
        df['브랜드_리스트'] = df['recommended_list'].apply(
            lambda x: [b.strip() for b in str(x).split(',') if b.strip()]
        )
        df_long = df.explode('브랜드_리스트').rename(columns={'브랜드_리스트': '브랜드'})
        df_long = df_long[df_long['브랜드'].str.strip() != '']
        df_long['유형'] = df_long['query_type']
        return df_long[['브랜드', 'procedure', '유형']].reset_index(drop=True)

    if 'peers_json' in cols:
        # geo_decoupled format
        rows = []
        for _, row in df.iterrows():
            if pd.isna(row.get('peers_json')):
                continue
            try:
                peers = json.loads(row['peers_json'])
            except (json.JSONDecodeError, TypeError):
                continue
            type_val = row.get('attribute', '')
            for peer in peers:
                name = peer.get('name', '').strip()
                if name:
                    rows.append({'브랜드': name, 'procedure': row['procedure'], '유형': type_val})
        return pd.DataFrame(rows)

    # legacy dummy_data.csv
    df = df.dropna(subset=['언급된 브랜드']).copy()
    df['브랜드_리스트'] = df['언급된 브랜드'].apply(
        lambda x: [b.strip() for b in x.split(',')]
    )
    df_long = df.explode('브랜드_리스트').rename(columns={'브랜드_리스트': '브랜드'})
    df_long = df_long[df_long['브랜드'].str.strip() != '']
    df_long['유형'] = df_long['유형']
    return df_long[['브랜드', 'procedure', '유형']].reset_index(drop=True)


def run(data_path: str, output_dir: str) -> None:
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    # ── 1. Load ───────────────────────────────────────────────────────────────
    raw = _load_csv(data_path)
    df_long = _extract_brands(raw)
    df_long = df_long.reset_index(drop=True)

    all_brands = sorted(df_long['브랜드'].unique().tolist())
    procedures = sorted(df_long['procedure'].unique().tolist())
    types      = sorted(df_long['유형'].unique().tolist())

    print(f'브랜드 {len(all_brands)}개 | 시술 {len(procedures)}개 | 유형 {len(types)}개')
    print('시술:', procedures)
    print('유형:', types)

    # ── 2. TF-IDF brand vectors ───────────────────────────────────────────────
    df_long['context_feature'] = df_long['procedure'] + ' | ' + df_long['유형']
    pivot_df = pd.crosstab(df_long['브랜드'], df_long['context_feature'])

    tfidf = TfidfTransformer()
    brand_tfidf = tfidf.fit_transform(pivot_df).toarray()
    tfidf_df = pd.DataFrame(brand_tfidf, index=pivot_df.index, columns=pivot_df.columns)

    # ── 3. Cosine similarity ──────────────────────────────────────────────────
    sim_matrix = cosine_similarity(brand_tfidf)
    sim_df = pd.DataFrame(sim_matrix, index=tfidf_df.index, columns=tfidf_df.index)

    # ── 4. t-SNE 2D coords ───────────────────────────────────────────────────
    n = len(tfidf_df)
    perp = min(max(n // 3, 2), 30)
    coords_2d = TSNE(
        n_components=2, perplexity=perp, random_state=42, max_iter=1000
    ).fit_transform(brand_tfidf)

    brand_coords = {
        brand: {'x': round(float(coords_2d[i, 0]), 4), 'y': round(float(coords_2d[i, 1]), 4)}
        for i, brand in enumerate(tfidf_df.index)
    }

    # ── 5. Procedure mention counts/rates ─────────────────────────────────────
    proc_pivot = pd.crosstab(df_long['브랜드'], df_long['procedure'])
    total_mentions = df_long.groupby('브랜드').size().to_dict()
    proc_rate = proc_pivot.div(proc_pivot.sum(axis=1), axis=0).fillna(0)

    # ── 6. Type mention counts/rates ─────────────────────────────────────────
    type_pivot = pd.crosstab(df_long['브랜드'], df_long['유형'])
    type_rate  = type_pivot.div(type_pivot.sum(axis=1), axis=0).fillna(0)

    # ── 7. Build JSON ─────────────────────────────────────────────────────────
    results = {
        'meta': {
            'brands':     all_brands,
            'procedures': procedures,
            'types':      types,
            'total_rows': len(raw),
        },
        'total_mentions': total_mentions,
        'proc_counts': {
            brand: {proc: int(proc_pivot.loc[brand, proc]) if proc in proc_pivot.columns else 0
                    for proc in procedures}
            for brand in tfidf_df.index
        },
        'proc_rates': {
            brand: {proc: round(float(proc_rate.loc[brand, proc]), 4) if proc in proc_rate.columns else 0.0
                    for proc in procedures}
            for brand in tfidf_df.index
        },
        'type_counts': {
            brand: {t: int(type_pivot.loc[brand, t]) if t in type_pivot.columns else 0
                    for t in types}
            for brand in tfidf_df.index
        },
        'type_rates': {
            brand: {t: round(float(type_rate.loc[brand, t]), 4) if t in type_rate.columns else 0.0
                    for t in types}
            for brand in tfidf_df.index
        },
        'top_features': {
            brand: [
                {'feature': feat, 'score': round(float(score), 4)}
                for feat, score in sorted(
                    tfidf_df.loc[brand].items(), key=lambda x: -x[1]
                ) if score > 0
            ][:10]
            for brand in tfidf_df.index
        },
        'similar_brands': {
            brand: [
                {'name': b, 'similarity': round(float(s), 4)}
                for b, s in sim_df[brand].drop(brand).sort_values(ascending=False).head(5).items()
            ]
            for brand in tfidf_df.index
        },
        'brand_coords': brand_coords,
    }

    out_path = out / 'tfidf_results.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f'저장: {out_path}')
    print(f'브랜드 {len(all_brands)}개 분석 완료')


if __name__ == '__main__':
    args = parse_args()
    run(args.data, args.output_dir)
