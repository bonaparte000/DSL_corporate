import platform
from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

if platform.system() == 'Darwin':
    matplotlib.rcParams['font.family'] = 'AppleGothic'
else:
    matplotlib.rcParams['font.family'] = 'NanumGothic'
matplotlib.rcParams['axes.unicode_minus'] = False

INTENT_COLORS = ['#E8455A', '#4A90D9', '#5CB85C', '#F0AD4E', '#9B59B6']


def plot_intent_boxplot(df: pd.DataFrame, stats: dict, output_dir: Path) -> None:
    intents     = df['intent'].unique().tolist()
    intent_data = {i: df.loc[df['intent'] == i, 'brand_rate'].values for i in intents}

    fig, axes = plt.subplots(1, 2, figsize=(16, 6))

    # 왼쪽: Box plot
    ax = axes[0]
    bp = ax.boxplot(
        [intent_data[i] for i in intents], labels=intents,
        patch_artist=True, medianprops=dict(color='black', linewidth=2),
    )
    for patch, color in zip(bp['boxes'], INTENT_COLORS):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)

    kw    = stats.get('kruskal', {})
    title = 'Intent별 Brand Rate 분포'
    if kw:
        title += f'\nKruskal-Wallis H={kw["H"]:.2f}, p={kw["p"]:.4f}'
    ax.set_title(title, fontsize=12, fontweight='bold')
    ax.set_ylabel('Brand Rate')
    ax.set_ylim(-0.05, 1.15)

    # 오른쪽: Pairwise effect size 행렬
    ax = axes[1]
    pairwise = pd.DataFrame(stats.get('pairwise', []))
    if not pairwise.empty:
        mat = pd.DataFrame(np.full((len(intents), len(intents)), np.nan),
                           index=intents, columns=intents)
        for _, row in pairwise.iterrows():
            mat.loc[row['A'], row['B']] =  row['effect_r']
            mat.loc[row['B'], row['A']] = -row['effect_r']
        mask = np.eye(len(intents), dtype=bool)
        sns.heatmap(mat, annot=True, fmt='.2f', cmap='RdBu_r', center=0,
                    vmin=-1, vmax=1, ax=ax, mask=mask, linewidths=0.5,
                    cbar_kws={'label': 'Rank-Biserial r (Effect Size)'})
        ax.set_title('Intent 간 Effect Size\n(양수: 행이 열보다 brand_rate 높음)',
                     fontsize=12, fontweight='bold')
    else:
        ax.set_visible(False)

    plt.tight_layout()
    _save(fig, output_dir / 'intent_analysis.png')


def plot_brand_intent_heatmap(bi_df: pd.DataFrame, output_dir: Path) -> None:
    if bi_df.empty:
        return
    intent_cols = [c for c in bi_df.columns if c not in ('gain', 'best_intent')]
    plot_df     = bi_df[intent_cols]

    h = max(6, len(plot_df) * 0.45)
    w = max(8, len(intent_cols) * 2.0)
    fig, ax = plt.subplots(figsize=(w, h))
    sns.heatmap(plot_df, annot=True, fmt='.3f', cmap='YlOrRd',
                linewidths=0.4, ax=ax,
                cbar_kws={'label': '답변당 언급 비율'})
    ax.set_title('브랜드 × Intent 언급 비율\n높을수록 해당 Intent 질문에서 더 자주 언급됨',
                 fontsize=12, fontweight='bold')
    ax.set_xlabel('Intent')
    ax.set_ylabel('브랜드')
    ax.tick_params(axis='x', rotation=0)
    plt.tight_layout()
    _save(fig, output_dir / 'brand_intent_matrix.png')


def plot_brand_gain(bi_df: pd.DataFrame, output_dir: Path) -> None:
    if bi_df.empty or 'gain' not in bi_df.columns:
        return
    top10 = bi_df.head(10)
    x     = np.arange(len(top10))

    fig, ax = plt.subplots(figsize=(12, 5))
    bars = ax.bar(x, top10['gain'], color='#4A90D9', alpha=0.8, edgecolor='grey')
    labels = [f'{b}\n({top10.loc[b, "best_intent"]})' for b in top10.index]
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=30, ha='right')
    ax.set_title('Intent 구조 변경 시 브랜드별 노출률 상승폭 (TOP 10)',
                 fontsize=12, fontweight='bold')
    ax.set_ylabel('Max Rate − Min Rate (언급률 상승폭)')
    ax.bar_label(bars, [f'+{v:.3f}' for v in top10['gain']], fontsize=9, padding=3)
    plt.tight_layout()
    _save(fig, output_dir / 'brand_gain.png')


def _save(fig, path: Path) -> None:
    fig.savefig(path, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f'  저장: {path}')
