from collections import Counter
from itertools import combinations

import numpy as np
import pandas as pd
from scipy.stats import kruskal, mannwhitneyu


def compute_brand_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """각 행(Q&A pair)에 has_brand, n_brands 컬럼 추가."""
    df = df.copy()
    df['brands']    = df['brands'].apply(lambda b: b if isinstance(b, list) else [])
    df['has_brand'] = df['brands'].apply(lambda b: 1 if len(b) > 0 else 0)
    df['n_brands']  = df['brands'].apply(len)
    return df


def compute_question_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """질문 단위로 여러 답변을 집계해 brand_rate, brand_counts 생성."""
    meta_cols  = [c for c in ['intent', '지역', '시술', '특징'] if c in df.columns]
    group_cols = ['question'] + meta_cols

    def agg(g):
        brand_lists = g['brands'].tolist()
        all_b = [b for bl in brand_lists for b in bl]
        counter = Counter(all_b)
        n = len(brand_lists)
        return pd.Series({
            'brand_rate':      sum(1 for bl in brand_lists if bl) / n,
            'n_unique_brands': len(counter),
            'brand_counts':    dict(counter),
            'top_brand':       counter.most_common(1)[0][0] if counter else None,
            'n_answers':       n,
        })

    return (
        df.groupby(group_cols, as_index=False)
        .apply(agg)
        .reset_index(drop=True)
    )


def compute_intent_stats(df: pd.DataFrame) -> dict:
    """Intent별 brand_rate 통계 + Kruskal-Wallis + pairwise Mann-Whitney."""
    if 'intent' not in df.columns or 'brand_rate' not in df.columns:
        return {}

    intents = df['intent'].unique().tolist()
    groups  = {i: df.loc[df['intent'] == i, 'brand_rate'].values for i in intents}

    result = {
        'intent_means': df.groupby('intent')['brand_rate'].mean().round(4).to_dict(),
        'intent_std':   df.groupby('intent')['brand_rate'].std().round(4).to_dict(),
        'intent_n':     df.groupby('intent').size().to_dict(),
    }

    if len(intents) >= 2:
        try:
            stat, p = kruskal(*[groups[i] for i in intents])
            result['kruskal'] = {'H': round(stat, 3), 'p': round(p, 4)}
        except Exception:
            pass

        pairs = list(combinations(intents, 2))
        pairwise = []
        for a, b in pairs:
            stat, p = mannwhitneyu(groups[a], groups[b], alternative='two-sided')
            n1, n2  = len(groups[a]), len(groups[b])
            r       = 1 - (2 * stat) / (n1 * n2)
            pairwise.append({
                'A': a, 'B': b,
                'p':        round(p, 4),
                'p_bonf':   round(min(p * len(pairs), 1.0), 4),
                'effect_r': round(r, 3),
                'significant': min(p * len(pairs), 1.0) < 0.05,
            })
        result['pairwise'] = sorted(pairwise, key=lambda x: x['p'])

    return result


def compute_brand_intent_matrix(df: pd.DataFrame,
                                top_n: int = 25,
                                min_count: int = 3) -> pd.DataFrame:
    """브랜드 × Intent 답변당 언급 비율 행렬."""
    if 'intent' not in df.columns:
        return pd.DataFrame()

    global_counter = Counter(b for bl in df['brands'] for b in bl)
    top_brands     = [b for b, c in global_counter.most_common(500)
                      if c >= min_count][:top_n]
    intents        = sorted(df['intent'].unique())
    intent_total   = df.groupby('intent').size()

    rows = {}
    for brand in top_brands:
        row = {}
        for intent in intents:
            subset   = df[df['intent'] == intent]
            mentions = subset['brands'].apply(lambda bl: bl.count(brand)).sum()
            row[intent] = round(mentions / intent_total[intent], 4)
        rows[brand] = row

    bi_df = pd.DataFrame(rows).T
    bi_df.index.name = 'brand'

    # gain 컬럼 추가 (최적 - 최악 intent 언급률)
    bi_df['gain']        = bi_df[intents].max(axis=1) - bi_df[intents].min(axis=1)
    bi_df['best_intent'] = bi_df[intents].idxmax(axis=1)

    return bi_df.sort_values('gain', ascending=False)
