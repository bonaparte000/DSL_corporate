#!/usr/bin/env python3
"""
Brand Analysis Pipeline
-----------------------
LLM 시뮬레이션 데이터를 입력받아 Intent별 브랜드 노출 패턴을 분석합니다.

Usage:
  # 1. generating_engine.ipynb 출력 직접 연결 (OpenAI 키 불필요)
  python run_pipeline.py --from-engine geo_decoupled_final_*.csv --region 강남

  # 2. Answer.ipynb 캐시에서 로드 (OpenAI 키 필요)
  python run_pipeline.py --from-notebook \\
    --answers ../cache/answers.json \\
    --questions ../questions.csv

  # 3. 전처리된 CSV/JSON 직접 입력 (OpenAI 키 필요)
  python run_pipeline.py input.csv [--api-key sk-...]
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

import pandas as pd
from openai import AsyncOpenAI

from pipeline import config
from pipeline.brand_extractor import extract_brands_all
from pipeline.analyzer import (
    compute_brand_intent_matrix,
    compute_brand_metrics,
    compute_intent_stats,
    compute_question_metrics,
)
from pipeline.visualizer import (
    plot_brand_gain,
    plot_brand_intent_heatmap,
    plot_intent_boxplot,
)


# ── 입력 로더 ──────────────────────────────────────────────────────────────────

def load_csv_json(path: str) -> pd.DataFrame:
    """전처리된 CSV/JSON → DataFrame."""
    p = Path(path)
    df = pd.read_json(p) if p.suffix == '.json' else pd.read_csv(p)
    missing = [c for c in ('question', 'answer') if c not in df.columns]
    if missing:
        raise ValueError(f'필수 컬럼 없음: {missing}')
    if 'intent' not in df.columns:
        df['intent'] = 'unknown'
    return df.reset_index(drop=True)


def load_notebook_cache(answers_path: str, questions_path: str) -> pd.DataFrame:
    """Answer.ipynb 캐시 (answers JSON + questions CSV) → DataFrame."""
    df_q = pd.read_csv(questions_path)

    def parse_keywords(kw_str: str) -> dict:
        result = {'지역': '', '시술': '', '특징': '', '조건': ''}
        for part in str(kw_str).split(','):
            part = part.strip()
            for key in result:
                if f'{key}:' in part:
                    result[key] = part.split(':', 1)[1].strip()
        return result

    kw_df = df_q['keywords'].apply(parse_keywords).apply(pd.Series)
    df_q  = pd.concat([df_q, kw_df], axis=1).reset_index(drop=True)

    with open(answers_path, encoding='utf-8') as f:
        all_answers = json.load(f)

    rows = []
    for q_idx, (row, answers) in enumerate(zip(df_q.itertuples(), all_answers)):
        for a_idx, answer in enumerate(answers):
            rows.append({
                'question': row.question,
                'answer':   answer,
                'intent':   row.intent,
                '지역':      row.지역,
                '시술':      row.시술,
                '특징':      getattr(row, '특징', ''),
            })

    return pd.DataFrame(rows).reset_index(drop=True)


def load_engine_csv(path: str, region: str = '') -> pd.DataFrame:
    """generating_engine.ipynb 출력 CSV → DataFrame.

    peers_json에서 병원명을 직접 추출하므로 LLM 재추출이 필요 없습니다.
    반환 DataFrame에는 'brands' 컬럼이 이미 포함됩니다.
    """
    df = pd.read_csv(path)
    missing = {'procedure', 'attribute', 'iteration', 'peers_json'} - set(df.columns)
    if missing:
        raise ValueError(f'엔진 CSV에 필요한 컬럼 없음: {missing}')

    def parse_brands(s):
        try:
            return [p['name'] for p in json.loads(s) if isinstance(p, dict) and 'name' in p]
        except (json.JSONDecodeError, TypeError):
            return []

    return pd.DataFrame({
        'question': region + ' ' + df['procedure'] + ' ' + df['attribute'] + ' 추천',
        'answer':   df['peers_json'],
        'intent':   df['attribute'],
        '지역':      region,
        '시술':      df['procedure'],
        '특징':      df['attribute'],
        'brands':   df['peers_json'].apply(parse_brands),
    }).reset_index(drop=True)


# ── 파이프라인 본체 ────────────────────────────────────────────────────────────

async def run(args: argparse.Namespace) -> None:
    config.CALL_DELAY      = args.call_delay
    config.MIN_BRAND_COUNT = args.min_brand_count

    results_dir = Path(args.output_dir)
    plots_dir   = results_dir / 'plots'
    cache_dir   = Path('cache')
    for d in (results_dir, plots_dir, cache_dir):
        d.mkdir(parents=True, exist_ok=True)

    # ── [1/5] 입력 로드 ────────────────────────────────────────────────────────
    if args.from_engine:
        print(f'\n[1/5] 엔진 CSV 로드: {args.from_engine}')
        df = load_engine_csv(args.from_engine, args.region)
        brands_ready = True
        cache_key = Path(args.from_engine).stem

    elif args.from_notebook:
        print(f'\n[1/5] 노트북 캐시 로드: {args.answers}')
        df = load_notebook_cache(args.answers, args.questions)
        brands_ready = False
        cache_key = Path(args.answers).stem

    else:
        print(f'\n[1/5] 입력 파일 로드: {args.input}')
        df = load_csv_json(args.input)
        brands_ready = False
        cache_key = Path(args.input).stem

    print(f'  행 수: {len(df)}')
    print(f'  Intent: {sorted(df["intent"].unique())}')

    # ── [2/5] 브랜드 추출 ─────────────────────────────────────────────────────
    print('\n[2/5] 브랜드 추출')
    if brands_ready:
        print('  peers_json에서 직접 로드 (LLM 재추출 생략)')
        all_brands = df['brands'].tolist()
    else:
        api_key = args.api_key or config.OPENAI_API_KEY
        if not api_key:
            print('오류: OpenAI API 키가 없습니다.')
            print('  --api-key 옵션 또는 OPENAI_API_KEY 환경변수를 설정하세요.')
            sys.exit(1)
        client       = AsyncOpenAI(api_key=api_key)
        brands_cache = cache_dir / f'brands_{cache_key}.json'

        if brands_cache.exists() and not args.no_cache:
            print(f'  캐시 사용: {brands_cache}')
            with open(brands_cache, encoding='utf-8') as f:
                all_brands = json.load(f)
        else:
            all_brands = await extract_brands_all(df['answer'].tolist(), client)
            with open(brands_cache, 'w', encoding='utf-8') as f:
                json.dump(all_brands, f, ensure_ascii=False, indent=2)
            print(f'  캐시 저장: {brands_cache}')

    df['brands'] = all_brands
    df = compute_brand_metrics(df)

    # ── [3/5] 질문 단위 집계 ──────────────────────────────────────────────────
    print('\n[3/5] 질문 단위 집계')
    if df.groupby('question').size().max() > 1:
        q_df = compute_question_metrics(df)
        print(f'  {len(q_df)}개 질문 (답변 여러 개 집계)')
    else:
        q_df = df.copy()
        q_df['brand_counts']    = df['brands'].apply(lambda bl: {b: 1 for b in bl})
        q_df['brand_rate']      = df['has_brand'].astype(float)
        q_df['n_unique_brands'] = df['n_brands']

    # ── [4/5] Intent 통계 분석 ────────────────────────────────────────────────
    print('\n[4/5] Intent 통계 분석')
    stats = compute_intent_stats(q_df)

    intent_means = stats.get('intent_means', {})
    print(f'\n  {"Intent":<20} {"Brand Rate":>12} {"N":>6}')
    print('  ' + '-' * 40)
    for intent, rate in sorted(intent_means.items(), key=lambda x: -x[1]):
        n = stats.get('intent_n', {}).get(intent, '-')
        print(f'  {intent:<20} {rate:>12.3f} {n:>6}')

    if 'kruskal' in stats:
        kw = stats['kruskal']
        print(f'\n  Kruskal-Wallis: H={kw["H"]}, p={kw["p"]}')

    if 'pairwise' in stats:
        print('\n  쌍별 비교 결과:')
        for row in stats['pairwise']:
            sig = ' **' if row['p_bonf'] < 0.05 else (' *' if row['p_bonf'] < 0.1 else '')
            print(f'    {row["A"]} vs {row["B"]}: '
                  f'p={row["p"]:.4f}, p_bonf={row["p_bonf"]:.4f}, '
                  f'r={row["effect_r"]:.3f}{sig}')

    bi_df = compute_brand_intent_matrix(df, top_n=args.top_brands, min_count=args.min_brand_count)
    print(f'\n  브랜드 × Intent 행렬: {len(bi_df)} 브랜드')
    if not bi_df.empty:
        print('\n  Intent 구조 변경 효과 상위 10개 브랜드:')
        for brand, row in bi_df.head(10).iterrows():
            print(f'    {brand:<18} best={row["best_intent"]:<12} gain=+{row["gain"]:.3f}')

    # ── [5/5] 결과 저장 및 시각화 ────────────────────────────────────────────
    print('\n[5/5] 결과 저장 및 시각화')

    df_save = df.copy()
    df_save['brands'] = df_save['brands'].apply(lambda b: ','.join(b))
    df_save.to_csv(results_dir / 'qa_with_brands.csv', index=False, encoding='utf-8-sig')
    print(f'  저장: {results_dir / "qa_with_brands.csv"}')

    with open(results_dir / 'intent_summary.json', 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    print(f'  저장: {results_dir / "intent_summary.json"}')

    if not bi_df.empty:
        bi_df.to_csv(results_dir / 'brand_intent_matrix.csv', encoding='utf-8-sig')
        print(f'  저장: {results_dir / "brand_intent_matrix.csv"}')

    plot_intent_boxplot(q_df, stats, plots_dir)
    plot_brand_intent_heatmap(bi_df, plots_dir)
    plot_brand_gain(bi_df, plots_dir)

    print(f'\n✓ 완료  →  {results_dir.resolve()}')


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description='LLM 시뮬레이션 브랜드 분석 파이프라인',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument('input',           nargs='?', default=None,
                     help='전처리된 CSV/JSON 파일')
    src.add_argument('--from-engine',   metavar='CSV',
                     help='generating_engine 출력 CSV (LLM 재추출 생략)')
    src.add_argument('--from-notebook', action='store_true',
                     help='Answer.ipynb 캐시에서 로드')

    # engine 모드 전용
    parser.add_argument('--region',    default='',
                        help='[engine] 지역명 (예: 강남)')

    # notebook 모드 전용
    parser.add_argument('--answers',   default='../cache/answers_gemini_n10.json',
                        help='[notebook] 답변 캐시 JSON')
    parser.add_argument('--questions', default='../prototype_questions/beauty_questions_V2_realistic.csv',
                        help='[notebook] 질문 CSV')

    # 공통 옵션
    parser.add_argument('--api-key',         default='',      help='OpenAI API 키')
    parser.add_argument('--output-dir',      default='results')
    parser.add_argument('--top-brands',      type=int, default=25)
    parser.add_argument('--min-brand-count', type=int, default=3)
    parser.add_argument('--call-delay',      type=float, default=1.5)
    parser.add_argument('--no-cache',        action='store_true')

    args = parser.parse_args()
    asyncio.run(run(args))


if __name__ == '__main__':
    main()
