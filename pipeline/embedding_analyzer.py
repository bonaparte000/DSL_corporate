import asyncio
import json
import platform
from collections import Counter
from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
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


# ── Q&A 페어 텍스트 구성 ──────────────────────────────────────────────────────

def build_qa_pairs(q_df) -> list:
    """질문 + 등장 브랜드 목록 → Q&A 페어 텍스트 리스트.

    예: "강남 라식 의료진 전문성 추천 → 아이리움안과, BGN밝은눈안과, 강남밝은세상안과"
    """
    pairs = []
    for row in q_df.itertuples():
        bc = row.brand_counts if hasattr(row, 'brand_counts') else {}
        if isinstance(bc, dict) and bc:
            # 등장 횟수 많은 순으로 정렬
            brands_text = ', '.join(
                b for b, _ in sorted(bc.items(), key=lambda x: -x[1])
            )
        else:
            brands_text = '없음'
        pairs.append(f"{row.question} → {brands_text}")
    return pairs


# ── 차원 축소 ─────────────────────────────────────────────────────────────────

def reduce_2d(vectors: np.ndarray) -> np.ndarray:
    """t-SNE로 2D 축소. 포인트 수에 맞게 perplexity 자동 조정."""
    n = len(vectors)
    if n <= 2:
        return vectors[:, :2]
    perplexity = min(max(n // 3, 2), 30)
    return TSNE(n_components=2, perplexity=perplexity,
                random_state=42, max_iter=1000).fit_transform(vectors)


# ── 유사도 분석 ───────────────────────────────────────────────────────────────

def top_similar(target_vec: np.ndarray, other_vecs: np.ndarray,
                labels: list, top_n: int = 10) -> list:
    """타겟 벡터와 나머지의 코사인 유사도 상위 top_n 반환."""
    sims = cosine_similarity(target_vec.reshape(1, -1), other_vecs)[0]
    ranked = sorted(zip(labels, sims.tolist()), key=lambda x: -x[1])
    return [{'label': lb, 'similarity': round(s, 4)} for lb, s in ranked[:top_n]]


# ── 시각화 ────────────────────────────────────────────────────────────────────

def _save(fig, path: Path) -> None:
    fig.savefig(path, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f'  저장: {path}')


def plot_qa_space(q_df, qa_pairs: list, coords: np.ndarray,
                  output_dir: Path, target: str = '') -> None:
    """Q&A 페어 latent space.

    색상: brand_rate (노출률)
    별표: 타겟 브랜드가 등장한 질문 시나리오
    """
    fig, ax = plt.subplots(figsize=(14, 9))

    rates = q_df['brand_rate'].values

    # 타겟 브랜드 등장 여부 (brand_counts에 타겟이 있는지)
    target_present = []
    for row in q_df.itertuples():
        bc = row.brand_counts if hasattr(row, 'brand_counts') else {}
        target_present.append(target in bc if isinstance(bc, dict) else False)

    # 타겟 미등장 점
    mask_no  = [not t for t in target_present]
    mask_yes = target_present

    sc = ax.scatter(
        coords[mask_no, 0], coords[mask_no, 1],
        c=np.array(rates)[mask_no], cmap='RdYlGn',
        s=120, vmin=0, vmax=1, alpha=0.7,
        edgecolors='grey', linewidths=0.5, zorder=2,
    )
    if any(mask_yes):
        ax.scatter(
            coords[mask_yes, 0], coords[mask_yes, 1],
            c=np.array(rates)[mask_yes], cmap='RdYlGn',
            s=260, vmin=0, vmax=1, alpha=0.95,
            edgecolors='#E8455A', linewidths=2.5,
            marker='*', zorder=3,
            label=f'★ {target} 등장',
        )

    # 라벨: 시술 + 속성
    for i, row in enumerate(q_df.itertuples()):
        if hasattr(row, '시술') and hasattr(row, '특징'):
            label = f"{row.시술}\n{row.특징}"
        else:
            label = str(row.question)[:20]
        ax.annotate(label, (coords[i, 0], coords[i, 1]),
                    fontsize=7, ha='center', va='bottom',
                    xytext=(0, 7), textcoords='offset points')

    cbar = plt.colorbar(sc, ax=ax)
    cbar.set_label('Brand Rate (전체 노출률)', fontsize=10)

    if any(mask_yes):
        ax.legend(fontsize=10, loc='upper right')

    title = 'Q&A 페어 Latent Space\n(질문 + 등장 브랜드 목록 임베딩)'
    if target:
        title += f'  |  ★ = {target} 등장 시나리오'
    ax.set_title(title, fontsize=13, fontweight='bold')
    ax.set_xlabel('t-SNE Dim 1')
    ax.set_ylabel('t-SNE Dim 2')
    plt.tight_layout()
    _save(fig, output_dir / 'qa_latent_space.png')


def plot_brand_space(brands: list, counts: list, coords: np.ndarray,
                     output_dir: Path, target: str = '') -> None:
    """브랜드 latent space — 크기: 언급 빈도, 색상: 타겟 여부."""
    fig, ax = plt.subplots(figsize=(14, 9))

    max_c  = max(counts) if counts else 1
    sizes  = [80 + (c / max_c) * 600 for c in counts]
    colors = ['#E8455A' if b == target else '#4A90D9' for b in brands]

    for i, (brand, color, size) in enumerate(zip(brands, colors, sizes)):
        ax.scatter(coords[i, 0], coords[i, 1], s=size, c=color,
                   alpha=0.85, edgecolors='grey', linewidths=0.5)

    top_threshold = sorted(counts, reverse=True)[min(15, len(counts) - 1)]
    for i, (brand, count) in enumerate(zip(brands, counts)):
        if count >= top_threshold or brand == target:
            ax.annotate(brand, (coords[i, 0], coords[i, 1]),
                        fontsize=8,
                        fontweight='bold' if brand == target else 'normal',
                        color='#E8455A' if brand == target else 'black',
                        ha='center', va='bottom',
                        xytext=(0, 5), textcoords='offset points')

    from matplotlib.lines import Line2D
    ax.legend(handles=[
        Line2D([0], [0], marker='o', color='w', markerfacecolor='#E8455A',
               markersize=10, label=f'타겟: {target}' if target else '타겟'),
        Line2D([0], [0], marker='o', color='w', markerfacecolor='#4A90D9',
               markersize=10, label='경쟁 브랜드'),
    ], loc='upper right', fontsize=9)

    ax.set_title('브랜드 Latent Space — 포지셔닝 맵\n(원 크기: 언급 빈도)',
                 fontsize=13, fontweight='bold')
    ax.set_xlabel('t-SNE Dim 1')
    ax.set_ylabel('t-SNE Dim 2')
    plt.tight_layout()
    _save(fig, output_dir / 'brand_latent_space.png')


def plot_brand_question_heatmap(q_df, top_brands: list,
                                output_dir: Path, target: str = '') -> None:
    """브랜드 × 질문 시나리오 등장 횟수 히트맵.

    "질문별로 어떤 브랜드가 잘 언급되는가"를 직접 보여줍니다.
    """
    if not top_brands:
        return

    # 질문 레이블 (시술 + 속성 or 질문 텍스트 축약)
    if '시술' in q_df.columns and '특징' in q_df.columns:
        q_labels = [f"{r.시술}\n{r.특징}" for r in q_df.itertuples()]
    else:
        q_labels = [str(r.question)[:20] for r in q_df.itertuples()]

    # 행렬 구성: 브랜드 × 질문
    matrix = np.zeros((len(top_brands), len(q_df)))
    for j, row in enumerate(q_df.itertuples()):
        bc = row.brand_counts if hasattr(row, 'brand_counts') else {}
        if isinstance(bc, dict):
            for i, brand in enumerate(top_brands):
                matrix[i, j] = bc.get(brand, 0)

    h = max(6, len(top_brands) * 0.45)
    w = max(8, len(q_df) * 1.2)
    fig, ax = plt.subplots(figsize=(w, h))

    sns.heatmap(
        matrix,
        xticklabels=q_labels,
        yticklabels=top_brands,
        annot=True, fmt='.0f',
        cmap='YlOrRd',
        linewidths=0.4, ax=ax,
        cbar_kws={'label': '등장 횟수'},
    )

    # 타겟 브랜드 행 강조
    if target and target in top_brands:
        t_idx = top_brands.index(target)
        ax.add_patch(plt.Rectangle(
            (0, t_idx), len(q_df), 1,
            fill=False, edgecolor='#E8455A', lw=3,
        ))

    ax.set_title('브랜드 × 질문 시나리오 등장 횟수\n(질문별로 어떤 브랜드가 잘 언급되는가)',
                 fontsize=13, fontweight='bold')
    ax.set_xlabel('질문 시나리오 (시술 × 속성)')
    ax.set_ylabel('브랜드')
    ax.tick_params(axis='x', labelsize=8)
    plt.tight_layout()
    _save(fig, output_dir / 'brand_question_heatmap.png')


def plot_similarity_bar(items: list, title: str,
                        output_dir: Path, filename: str) -> None:
    """코사인 유사도 상위 N개 막대그래프."""
    if not items:
        return
    labels = [it['label'][:50] for it in items]
    sims   = [it['similarity'] for it in items]

    fig, ax = plt.subplots(figsize=(11, max(4, len(labels) * 0.55)))
    bars = ax.barh(range(len(labels)), sims,
                   color='#4A90D9', alpha=0.8, edgecolor='grey')
    ax.set_yticks(range(len(labels)))
    ax.set_yticklabels(labels, fontsize=8)
    ax.invert_yaxis()
    ax.set_xlabel('코사인 유사도')
    ax.set_xlim(0, 1)
    ax.bar_label(bars, [f'{s:.3f}' for s in sims], fontsize=8, padding=3)
    ax.set_title(title, fontsize=12, fontweight='bold')
    plt.tight_layout()
    _save(fig, output_dir / filename)


# ── 메인 실행 ─────────────────────────────────────────────────────────────────

async def run_embedding_analysis(df, q_df, plots_dir: Path, results_dir: Path,
                                  client: AsyncOpenAI,
                                  target: str = '',
                                  model: str = 'text-embedding-3-small') -> None:
    """임베딩 + Latent Space 분석 전체 실행."""
    print(f'\n[6/6] 임베딩 & Latent Space 분석  (모델: {model})')

    summary = {'target': target, 'model': model}

    # ── Q&A 페어 구성 및 임베딩 ───────────────────────────────────────────────
    qa_pairs = build_qa_pairs(q_df)
    print(f'  Q&A 페어 {len(qa_pairs)}개 임베딩 중...')
    print(f'  예시: {qa_pairs[0][:80]}')

    qa_vecs  = await embed_texts(qa_pairs, client, model)
    qa_coords = reduce_2d(qa_vecs)
    plot_qa_space(q_df, qa_pairs, qa_coords, plots_dir, target)

    # ── 브랜드 × 질문 히트맵 ─────────────────────────────────────────────────
    brand_counter = Counter(b for bl in df['brands'] for b in bl)
    top_brands    = [b for b, _ in brand_counter.most_common(20)]
    plot_brand_question_heatmap(q_df, top_brands, plots_dir, target)

    # ── 브랜드 임베딩 ─────────────────────────────────────────────────────────
    if not brand_counter:
        print('  브랜드 데이터 없음 — 브랜드 임베딩 생략')
        return

    brand_list   = list(brand_counter.keys())
    brand_counts = [brand_counter[b] for b in brand_list]

    print(f'  브랜드 {len(brand_list)}개 임베딩 중...')
    b_vecs   = await embed_texts(brand_list, client, model)
    b_coords = reduce_2d(b_vecs)
    plot_brand_space(brand_list, brand_counts, b_coords, plots_dir, target)

    # ── 타겟 브랜드 유사도 분석 ───────────────────────────────────────────────
    if target and target in brand_list:
        t_idx = brand_list.index(target)
        t_vec = b_vecs[t_idx]

        # 타겟과 유사한 경쟁 브랜드
        other_idx = [i for i in range(len(brand_list)) if i != t_idx]
        similar_brands = top_similar(
            t_vec, b_vecs[other_idx],
            [brand_list[i] for i in other_idx],
        )

        # 타겟 브랜드와 가장 유사한 Q&A 페어 (타겟이 잘 나오는 질문 맥락)
        similar_qa = top_similar(t_vec, qa_vecs, qa_pairs)

        summary['similar_brands']    = similar_brands
        summary['optimal_qa_pairs']  = similar_qa

        print(f'\n  [{target}] 의미 공간에서 가장 가까운 경쟁 브랜드:')
        for it in similar_brands[:5]:
            print(f"    {it['label']:<22} sim={it['similarity']:.4f}")

        print(f'\n  [{target}] 노출에 최적인 Q&A 맥락 (유사도 순):')
        for it in similar_qa[:5]:
            print(f"    {it['label'][:60]:<62} sim={it['similarity']:.4f}")

        plot_similarity_bar(
            similar_brands[:10],
            f'[{target}] 의미 공간 내 경쟁 브랜드 유사도',
            plots_dir, 'brand_similarity.png',
        )
        plot_similarity_bar(
            similar_qa[:10],
            f'[{target}] 노출 최적 Q&A 맥락 유사도',
            plots_dir, 'qa_similarity.png',
        )

    elif target:
        print(f'  경고: 타겟 브랜드 "{target}"이 데이터에 없습니다.')

    # 결과 저장
    out_path = results_dir / 'embedding_summary.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f'  저장: {out_path}')
