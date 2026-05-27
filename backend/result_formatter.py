"""
tfidf_results.json → Frontend JSON transformer.

새 파이프라인(dummy_data.csv + TF-IDF) 기반.
"""
import json
from pathlib import Path

PROCEDURE_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981']
TYPE_COLORS      = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']


def _norm(s: str) -> str:
    """공백·하이픈 제거 후 소문자 정규화."""
    return s.lower().replace(' ', '').replace('-', '').replace('_', '')


def _find_brand(data: dict, brand: str):
    """브랜드명 부분 일치 탐색 (공백 정규화 포함).
    우선순위: 정규화 정확일치 > 정규화 포함 (짧은 것 우선).
    """
    bl_raw = brand.lower().strip()
    bl = _norm(brand)
    candidates = []
    for name in data:
        nl_raw = name.lower()
        nl = _norm(name)
        if nl == bl:
            return name  # normalized exact match
        if bl in nl or nl in bl:
            candidates.append(name)
    if not candidates:
        return None
    candidates.sort(key=lambda n: (not _norm(n).startswith(bl), len(n)))
    return candidates[0]


def _make_insights(radar: list, brand: str) -> list:
    insights = []
    for item in radar:
        proc = item['intent']
        ours = item['우리브랜드']
        comp = item['경쟁사평균']
        diff = ours - comp

        if ours < 10 and diff < -15:
            insights.append({
                'level': 'critical', 'icon': 'AlertTriangle',
                'title': f'{proc} 영역 심각한 소외',
                'desc': f'{proc}에서 언급 비율 {ours}% — 경쟁사 평균 대비 {abs(int(diff))}%p 낮음',
                'action': f'처방 적용 시 +{min(int(abs(diff) * 0.6), 40)}% 상승 예측',
            })
        elif ours < 25 and diff < -10:
            insights.append({
                'level': 'warning', 'icon': 'AlertCircle',
                'title': f'{proc} 영역 취약',
                'desc': f'{proc}에서 언급 비율 {ours}% — 경쟁사 평균 대비 {abs(int(diff))}%p 낮음',
                'action': '콘텐츠 보강 권장',
            })
        elif ours > 40:
            insights.append({
                'level': 'success', 'icon': 'Award',
                'title': f'{proc} 영역 강세',
                'desc': f'{proc} 언급 비율 {ours}% — 업계 상위권',
                'action': '현재 전략 유지 권장',
            })
        elif diff > -5 and ours > 15:
            insights.append({
                'level': 'info', 'icon': 'Lightbulb',
                'title': f'{proc} 성장 기회',
                'desc': f'{proc} 언급 비율 {ours}% — 소폭 개선 여지 존재',
                'action': f'처방 적용 시 +{15 + int(abs(diff) // 3)}% 상승 예측',
            })

    return insights[:4]


def _make_prescriptions(brand: str, radar: list) -> list:
    TEMPLATES = {
        '스마일라식':    {'title': '스마일라식 차별화 페이지 구축', 'detail': '절개 최소화·회복 빠름 등 스마일라식 고유 장점을 데이터와 함께 구체적으로 명시하세요. LLM은 체계적 정보 콘텐츠를 우선 인용합니다.'},
        '라섹':          {'title': '라섹 비교 콘텐츠 발행', 'detail': '라식 vs 라섹 비교 가이드를 발행하세요. 두께 부족 등 라섹 적합 케이스를 명시하면 LLM 노출이 높아집니다.'},
        '백내장 수술':   {'title': '백내장 수술 전문성 콘텐츠 발행', 'detail': '다초점 렌즈 종류·적합 연령대·수술 후 시력 데이터를 포함한 전문 정보 페이지를 구축하세요.'},
        '노안 교정술':   {'title': '노안 교정술 인지도 제고 콘텐츠', 'detail': '노안 교정술의 종류(모노비전·다초점)와 삶의 질 개선 경험담을 타임라인 형태로 발행하세요.'},
        '안구건조증 치료': {'title': '안구건조증 치료 차별화 페이지 구축', 'detail': 'IPL·LipiFlow 등 최신 치료 장비와 치료 효과 수치를 구체적으로 명시하세요.'},
        # legacy / alternate spellings
        '라식/라섹 수술': {'title': '라식/라섹 전문 콘텐츠 강화', 'detail': '라식·라섹 수술 장점·적합 대상·회복기간을 구조화된 표 형태로 발행하세요.'},
        '노안 수술':      {'title': '노안 수술 인지도 제고 콘텐츠', 'detail': '노안 수술의 종류(모노비전·다초점)와 삶의 질 개선 경험담을 타임라인 형태로 발행하세요.'},
        '안구건조증 클리닉': {'title': '안구건조증 치료 차별화 페이지 구축', 'detail': 'IPL·LipiFlow 등 최신 치료 장비와 치료 효과 수치를 구체적으로 명시하세요.'},
        '라식':      {'title': '라식 전문 콘텐츠 강화', 'detail': '라식 수술 장점·적합 대상·회복기간을 구조화된 표 형태로 발행하세요.'},
        '노안교정술': {'title': '노안교정술 인지도 제고 콘텐츠', 'detail': '노안교정술의 종류(모노비전·다초점)와 삶의 질 개선 경험담을 타임라인 형태로 발행하세요.'},
    }
    prescriptions = []
    weak = sorted(radar, key=lambda x: x['우리브랜드'])
    for item in weak:
        if len(prescriptions) >= 3:
            break
        proc = item['intent']
        ours = item['우리브랜드']
        comp = item['경쟁사평균']
        if ours >= 60:
            continue
        urgency = 'critical' if ours < 10 else ('warning' if ours < 25 else 'info')
        gain = max(15, min(45, int((comp - ours) * 0.5 + 15)))
        tmpl = TEMPLATES.get(proc, {'title': f'{proc} 콘텐츠 강화', 'detail': f'{proc} 관련 콘텐츠 보강이 필요합니다.'})
        draft = (
            f"# {tmpl['title']}\n\n"
            f"## 들어가며\n\n**{brand}**의 '{proc}' 콘텐츠를 강화해 LLM 노출 확률을 높이기 위한 전략 문서입니다.\n\n"
            f"현재 '{proc}' 언급 비율은 **{ours}%** 로, 경쟁사 평균({comp}%)에 비해 낮습니다.\n\n"
            "---\n\n## 핵심 개선 전략\n\n"
            "1. **구조화된 정보 제공**: LLM은 표·목록·비교 형식 콘텐츠를 우선 인용합니다.\n"
            "2. **구체적 수치 포함**: 데이터 기반 정보를 제공하세요.\n"
            "3. **질문-답변 형식 활용**: 자주 묻는 질문에 명확하게 답하는 구조로 작성하세요.\n\n"
            "---\n\n## 예시 콘텐츠 구조\n\n"
            f"| 항목 | {brand} | 업계 평균 |\n|------|---------|----------|\n"
            "| (항목 1) | (내용) | (비교) |\n| (항목 2) | (내용) | (비교) |\n\n"
            f"---\n\n*본 콘텐츠는 AEO 플랫폼이 '{proc}' 노출 최적화를 위해 자동 생성한 초안입니다.*"
        )
        prescriptions.append({
            'priority': len(prescriptions) + 1,
            'intent': proc,
            'urgency': urgency,
            'title': tmpl['title'],
            'detail': tmpl['detail'],
            'expectedGain': f'+{gain}%',
            'draft': draft,
        })
    return prescriptions


def format_results(brand: str, results_dir: Path) -> dict:
    tfidf_path = results_dir / 'tfidf_results.json'
    with open(tfidf_path, encoding='utf-8') as f:
        data = json.load(f)

    procedures = data['meta']['procedures']
    types      = data['meta']['types']

    matched = _find_brand(data['total_mentions'], brand)
    brand_found = matched is not None

    # ── 시술별 언급 비율 (Radar) ──────────────────────────────────────────────
    all_proc_rates = data['proc_rates']
    if brand_found:
        our_proc = {p: round(all_proc_rates[matched].get(p, 0) * 100) for p in procedures}
    else:
        our_proc = {p: 0 for p in procedures}

    others = [b for b in all_proc_rates if b != matched]
    if others:
        comp_proc = {
            p: round(sum(all_proc_rates[b].get(p, 0) for b in others) / len(others) * 100)
            for p in procedures
        }
    else:
        comp_proc = {p: 20 for p in procedures}

    radar = [
        {'intent': p, '우리브랜드': our_proc[p], '경쟁사평균': comp_proc[p]}
        for p in procedures
    ]

    # ── 유형별 비율 (Pie) ─────────────────────────────────────────────────────
    if brand_found:
        type_counts = data['type_counts'][matched]
        total_types = sum(type_counts.values()) or 1
        pie = [
            {'name': t, 'value': round(type_counts.get(t, 0) / total_types * 100)}
            for t in types
        ]
    else:
        pie = [{'name': t, 'value': round(100 / len(types))} for t in types]

    # ── 브랜드 포지셔닝 맵 (Scatter from t-SNE) ───────────────────────────────
    brand_coords = data.get('brand_coords', {})
    # 시술별 클러스터: 해당 시술에서 언급된 브랜드들의 좌표
    clusters = {}
    for i, proc in enumerate(procedures):
        pts = []
        for b, coords in brand_coords.items():
            if b == matched:
                continue
            rate = all_proc_rates.get(b, {}).get(proc, 0)
            if rate > 0:
                pts.append({'x': coords['x'], 'y': coords['y'], 'z': round(rate * 30 + 10, 1)})
        if pts:
            clusters[proc] = pts

    brand_point = None
    if brand_found and matched in brand_coords:
        c = brand_coords[matched]
        brand_point = [{'x': c['x'], 'y': c['y'], 'z': 50}]

    # 거리 계산
    distances = []
    bp = brand_point[0] if brand_point else {'x': 0.0, 'y': 0.0}
    for i, (proc, pts) in enumerate(clusters.items()):
        if not pts:
            continue
        cx = sum(p['x'] for p in pts) / len(pts)
        cy = sum(p['y'] for p in pts) / len(pts)
        dist = round(((bp['x'] - cx) ** 2 + (bp['y'] - cy) ** 2) ** 0.5, 1)
        status = '근접' if dist < 2 else ('보통' if dist < 3.5 else ('원거리' if dist < 5 else '최원거리'))
        distances.append({
            'intent': proc, 'dist': dist,
            'status': status, 'ok': dist < 3.5,
            'color': PROCEDURE_COLORS[i % len(PROCEDURE_COLORS)],
        })

    # ── 유사 브랜드 ───────────────────────────────────────────────────────────
    similar = data['similar_brands'].get(matched, []) if brand_found else []

    # ── KPI ──────────────────────────────────────────────────────────────────
    our_mentions = data['total_mentions'].get(matched, 0) if brand_found else 0
    total_all    = sum(data['total_mentions'].values()) or 1
    exposure_pct = round(our_mentions / total_all * 100)

    top_comp_name, top_comp_sim = '', 0.0
    if similar:
        top_comp_name = similar[0]['name']
        top_comp_sim  = round(similar[0]['similarity'] * 100)

    our_vals = list(our_proc.values())
    avg_rate = round(sum(our_vals) / len(our_vals)) if our_vals else 0
    max_comp = max(comp_proc.values(), default=100) or 100
    aeo_score = max(5, min(95, round((avg_rate / max_comp) * 70 + avg_rate * 0.3)))

    urgent = sum(1 for r in radar if r['우리브랜드'] < 10 and r['경쟁사평균'] - r['우리브랜드'] > 15)

    insights      = _make_insights(radar, brand)
    prescriptions = _make_prescriptions(brand, radar)
    gain_sum = sum(int(p['expectedGain'].replace('+', '').replace('%', '')) for p in prescriptions)

    # ── 핵심 강점 features ────────────────────────────────────────────────────
    top_features = data['top_features'].get(matched, []) if brand_found else []

    return {
        'brand':       brand,
        'brand_found': brand_found,
        'kpi': {
            'brand_exposure_rate': exposure_pct,
            'top_competitor_rate': top_comp_sim,
            'top_competitor_name': top_comp_name,
            'total_questions':     data['meta']['total_rows'],
        },
        'radar':          radar,
        'pie':            pie,
        'top_features':   top_features,
        'similar_brands': similar,
        'insights':       insights,
    }
