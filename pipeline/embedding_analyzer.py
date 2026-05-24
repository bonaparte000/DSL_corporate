import asyncio
import json
import platform
from collections import Counter
from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
from openai import AsyncOpenAI
from sklearn.manifold import TSNE
from sklearn.metrics.pairwise import cosine_similarity

if platform.system() == 'Darwin':
    matplotlib.rcParams['font.family'] = 'AppleGothic'
else:
    matplotlib.rcParams['font.family'] = 'NanumGothic'
matplotlib.rcParams['axes.unicode_minus'] = False


# ── 임베딩 ────────────────────────────────────────────────────────────────────

async def _embed_batch(texts: list, client: AsyncOpenAI, model: str) -> np.ndarray:
    resp = await client.embeddings.create(model=model, input=texts)
    return np.array([d.embedding for d in resp.data])


async def embed_texts(texts: list, client: AsyncOpenAI,
                      model: str = 'text-embedding-3-small',
                      batch_size: int = 100) -> np.ndarray:
    """텍스트 리스트 → 임베딩 행렬 (N × D)."""
    all_vecs = []
    for i in range(0, len(texts), batch_size):
        vecs = await _embed_batch(texts[i:i + batch_size], client, model)
        all_vecs.append(vecs)
        await asyncio.sleep(0.3)
    return np.vstack(all_vecs)


# ── 차원 축소 ─────────────────────────────────────────────────────────────────

def reduce_2d(vectors: np.ndarray) -> np.ndarray:
    """t-SNE로 2D 축소. 포인트 수에 맞게 perplexity 자동 조정."""
    n = len(vectors)
    if n <= 2:
        # 포인트가 너무 적으면 PCA 대신 첫 두 차원만 사용
        return vectors[:, :2]
    perplexity = min(max(n // 3, 2), 30)
    return TSNE(n_components=2, perplexity=perplexity,
                random_state=42, max_iter=1000).fit_transform(vectors)


# ── 시각화 ────────────────────────────────────────────────────────────────────

def _save(fig, path: Path) -> None:
    fig.savefig(path, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f'  저장: {path}')


def plot_question_space(q_df, coords: np.ndarray,
                        output_dir: Path, target: str = '') -> None:
    """질문 latent space — 색상: brand_rate."""
    fig, ax = plt.subplots(figsize=(13, 8))

    rates = q_df['brand_rate'].values
    sc = ax.scatter(coords[:, 0], coords[:, 1],
                    c=rates, cmap='RdYlGn', s=140,
                    vmin=0, vmax=1, alpha=0.85,
                    edgecolors='grey', linewidths=0.5)

    for i, row in enumerate(q_df.itertuples()):
        if hasattr(row, '시술') and hasattr(row, '특징'):
            label = f"{row.시술}\n{row.특징}"
        else:
            label = str(row.question)[:25]
        ax.annotate(label, (coords[i, 0], coords[i, 1]),
                    fontsize=7, ha='center', va='bottom',
                    xytext=(0, 6), textcoords='offset points')

    cbar = plt.colorbar(sc, ax=ax)
    cbar.set_label('Brand Rate (노출률)', fontsize=10)

    title = '질문 Latent Space — 노출률 분포'
    if target:
        title += f'  |  타겟: {target}'
    ax.set_title(title, fontsize=13, fontweight='bold')
    ax.set_xlabel('t-SNE Dim 1')
    ax.set_ylabel('t-SNE Dim 2')
    plt.tight_layout()
    _save(fig, output_dir / 'question_latent_space.png')


def plot_brand_space(brands: list, counts: list, coords: np.ndarray,
                     output_dir: Path, target: str = '') -> None:
    """브랜드 latent space — 크기: 언급 빈도, 색상: 타겟 여부."""
    fig, ax = plt.subplots(figsize=(14, 9))

    max_c = max(counts) if counts else 1
    sizes  = [80 + (c / max_c) * 600 for c in counts]
    colors = ['#E8455A' if b == target else '#4A90D9' for b in brands]
    alphas = [1.0 if b == target else 0.7 for b in brands]

    for i, (brand, color, size, alpha) in enumerate(zip(brands, colors, sizes, alphas)):
        ax.scatter(coords[i, 0], coords[i, 1],
                   s=size, c=color, alpha=alpha,
                   edgecolors='grey', linewidths=0.5)

    # 상위 빈도 브랜드 + 타겟만 라벨 표시
    top_threshold = sorted(counts, reverse=True)[min(15, len(counts) - 1)]
    for i, (brand, count) in enumerate(zip(brands, counts)):
        if count >= top_threshold or brand == target:
            weight = 'bold' if brand == target else 'normal'
            color  = '#E8455A' if brand == target else 'black'
            ax.annotate(brand, (coords[i, 0], coords[i, 1]),
                        fontsize=8, fontweight=weight, color=color,
                        ha='center', va='bottom',
                        xytext=(0, 5), textcoords='offset points')

    from matplotlib.lines import Line2D
    legend_items = [
        Line2D([0], [0], marker='o', color='w',
               markerfacecolor='#E8455A', markersize=10,
               label=f'타겟: {target}' if target else '타겟'),
        Line2D([0], [0], marker='o', color='w',
               markerfacecolor='#4A90D9', markersize=10,
               label='경쟁 브랜드'),
    ]
    ax.legend(handles=legend_items, loc='upper right', fontsize=9)

    ax.set_title('브랜드 Latent Space — 포지셔닝 맵\n(원 크기: 언급 빈도)',
                 fontsize=13, fontweight='bold')
    ax.set_xlabel('t-SNE Dim 1')
    ax.set_ylabel('t-SNE Dim 2')
    plt.tight_layout()
    _save(fig, output_dir / 'brand_latent_space.png')


def plot_similarity_bar(items: list, title: str,
                        output_dir: Path, filename: str) -> None:
    """코사인 유사도 상위 N개 막대그래프."""
    if not items:
        return
    labels = [it['label'] for it in items]
    sims   = [it['similarity'] for it in items]

    fig, ax = plt.subplots(figsize=(10, max(4, len(labels) * 0.5)))
    bars = ax.barh(range(len(labels)), sims,
                   color='#4A90D9', alpha=0.8, edgecolor='grey')
    ax.set_yticks(range(len(labels)))
    ax.set_yticklabels(labels, fontsize=9)
    ax.invert_yaxis()
    ax.set_xlabel('코사인 유사도')
    ax.set_xlim(0, 1)
    ax.bar_label(bars, [f'{s:.3f}' for s in sims], fontsize=8, padding=3)
    ax.set_title(title, fontsize=12, fontweight='bold')
    plt.tight_layout()
    _save(fig, output_dir / filename)


# ── 유사도 분석 ───────────────────────────────────────────────────────────────

def top_similar(target_vec: np.ndarray, other_vecs: np.ndarray,
                labels: list, top_n: int = 10) -> list:
    """타겟 벡터와 나머지의 코사인 유사도 상위 top_n 반환."""
    sims = cosine_similarity(target_vec.reshape(1, -1), other_vecs)[0]
    ranked = sorted(zip(labels, sims.tolist()), key=lambda x: -x[1])
    return [{'label': lb, 'similarity': round(s, 4)} for lb, s in ranked[:top_n]]


# ── 메인 실행 ─────────────────────────────────────────────────────────────────

async def run_embedding_analysis(df, q_df, plots_dir: Path, results_dir: Path,
                                  client: AsyncOpenAI,
                                  target: str = '',
                                  model: str = 'text-embedding-3-small') -> None:
    """임베딩 + Latent Space 분석 전체 실행."""
    print(f'\n[6/6] 임베딩 & Latent Space 분석  (모델: {model})')

    summary = {'target': target, 'model': model}

    # ── 질문 임베딩 ───────────────────────────────────────────────────────────
    unique_questions = q_df['question'].tolist()
    print(f'  질문 {len(unique_questions)}개 임베딩 중...')
    q_vecs = await embed_texts(unique_questions, client, model)

    q_coords = reduce_2d(q_vecs)
    plot_question_space(q_df, q_coords, plots_dir, target)

    # ── 브랜드 임베딩 ─────────────────────────────────────────────────────────
    brand_counter = Counter(b for bl in df['brands'] for b in bl)
    if not brand_counter:
        print('  브랜드 데이터 없음 — 브랜드 임베딩 생략')
        return

    brand_list   = list(brand_counter.keys())
    brand_counts = [brand_counter[b] for b in brand_list]

    print(f'  브랜드 {len(brand_list)}개 임베딩 중...')
    b_vecs = await embed_texts(brand_list, client, model)

    b_coords = reduce_2d(b_vecs)
    plot_brand_space(brand_list, brand_counts, b_coords, plots_dir, target)

    # ── 타겟 브랜드 유사도 분석 ───────────────────────────────────────────────
    if target and target in brand_list:
        t_idx = brand_list.index(target)
        t_vec = b_vecs[t_idx]

        # 타겟과 유사한 경쟁 브랜드
        other_idx    = [i for i in range(len(brand_list)) if i != t_idx]
        similar_brands = top_similar(
            t_vec,
            b_vecs[other_idx],
            [brand_list[i] for i in other_idx],
        )

        # 타겟과 의미적으로 가까운 질문 (노출 최적 맥락)
        similar_questions = top_similar(t_vec, q_vecs, unique_questions)

        summary['similar_brands']    = similar_brands
        summary['optimal_questions'] = similar_questions

        print(f'\n  [{target}] 의미 공간에서 가장 가까운 경쟁 브랜드:')
        for it in similar_brands[:5]:
            print(f"    {it['label']:<22} sim={it['similarity']:.4f}")

        print(f'\n  [{target}] 노출에 최적화된 질문 맥락 (유사도 순):')
        for it in similar_questions[:5]:
            print(f"    {it['label']:<40} sim={it['similarity']:.4f}")

        # 유사도 막대그래프 저장
        plot_similarity_bar(
            similar_brands[:10],
            f'[{target}] 의미 공간 내 경쟁 브랜드 유사도',
            plots_dir, 'brand_similarity.png',
        )
        plot_similarity_bar(
            similar_questions[:10],
            f'[{target}] 노출 최적 질문 맥락 유사도',
            plots_dir, 'question_similarity.png',
        )

    elif target:
        print(f'  경고: 타겟 브랜드 "{target}"이 데이터에 없습니다.')

    # 결과 저장
    out_path = results_dir / 'embedding_summary.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f'  저장: {out_path}')
