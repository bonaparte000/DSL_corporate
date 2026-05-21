/**
 * AEO Intelligence Platform — Screen 3 & 4
 * Dependencies: react, recharts, lucide-react, tailwindcss
 */

import React, { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Tooltip, Legend,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, Target, Zap, Copy, Check, ChevronRight,
  AlertCircle, Lightbulb, Brain, FileText, Award,
  Info, ArrowUpRight, BarChart2,
} from 'lucide-react';

// ─── DUMMY DATA ───────────────────────────────────────────────────────────────

const BRAND_NAME = '강남 밝은눈 안과';

const radarData = [
  { intent: '신뢰/권위',  우리병원: 72, 경쟁사평균: 55 },
  { intent: '정보/스펙',  우리병원: 28, 경쟁사평균: 68 },
  { intent: '경험/감성',  우리병원: 61, 경쟁사평균: 57 },
  { intent: '가격/비교',  우리병원: 15, 경쟁사평균: 74 },
  { intent: '추천형',     우리병원: 67, 경쟁사평균: 52 },
  { intent: '전문가형',   우리병원: 80, 경쟁사평균: 45 },
];

const pieData = [
  { name: '강남 밝은눈 안과', value: 24 },
  { name: '라식 아이센터',    value: 31 },
  { name: '강남 연세안과',    value: 22 },
  { name: '기타 경쟁사',      value: 23 },
];
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#334155'];

const clusterTrust   = [{x:3.2,y:4.1,z:20},{x:3.8,y:3.7,z:18},{x:3.5,y:4.5,z:22},{x:4.0,y:4.2,z:16},{x:3.1,y:3.9,z:14}];
const clusterInfo    = [{x:-2.1,y:1.5,z:19},{x:-2.6,y:2.1,z:21},{x:-1.8,y:1.2,z:17},{x:-2.4,y:0.8,z:15},{x:-3.0,y:1.7,z:23}];
const clusterEmotion = [{x:0.5,y:-2.8,z:18},{x:1.2,y:-3.2,z:20},{x:-0.3,y:-2.5,z:16},{x:0.8,y:-3.8,z:22},{x:1.5,y:-2.2,z:14}];
const clusterPrice   = [{x:-3.5,y:-1.2,z:24},{x:-4.0,y:-0.8,z:19},{x:-3.2,y:-1.8,z:21},{x:-4.2,y:-1.5,z:17},{x:-3.8,y:-2.0,z:15}];
const ourBrand       = [{x:2.1,y:0.4,z:50}];

const insights = [
  {
    level: 'critical', Icon: AlertTriangle,
    title: '가격/비교 의도에서 심각한 소외',
    desc: '"스마일라식 가격 비교" 유형 질문에서 노출률 15% — 1위 경쟁사 대비 −59%p',
    action: '처방 적용 시 +38% 상승 예측',
  },
  {
    level: 'warning', Icon: AlertCircle,
    title: '정보/스펙 영역 취약',
    desc: '"최신 장비", "수술 방식 비교" 질문군에서 잠재 공간 거리 4.2 — 전 의도 중 최원거리',
    action: '기술 정보성 콘텐츠 보강 권장',
  },
  {
    level: 'success', Icon: Award,
    title: '신뢰/권위 의도에서 TOP 1 유지',
    desc: '"의사 경력", "사후관리" 관련 질문에서 72% 노출률 — 업계 1위 유지 중',
    action: '현재 전략 유지 권장',
  },
  {
    level: 'info', Icon: Lightbulb,
    title: '경험/감성 영역 성장 기회',
    desc: '"내돈내산 후기" 질문군 노출률 61% — 소폭 개선 여지 존재',
    action: '처방 적용 시 +22% 상승 예측',
  },
];

const prescriptions = [
  {
    priority: 1, intent: '가격/비교', urgency: 'critical',
    title: '스마일라식 가격 비교 정보성 콘텐츠 발행',
    detail: '타원장 대비 가격 구조와 포함 서비스를 명시한 "비교표" 포함 블로그를 발행하세요. LLM은 구조화된 정보(표, 목록)를 포함한 콘텐츠를 우선 인용합니다.',
    expectedGain: '+38%',
  },
  {
    priority: 2, intent: '정보/스펙', urgency: 'warning',
    title: '최신 장비 및 수술 방식 전문 페이지 구축',
    detail: '"VISX iDESIGN", "Contoura Vision" 등 장비명을 명시하고 각 수술 방식의 적합 대상을 표 형태로 정리한 전문 정보 페이지가 필요합니다.',
    expectedGain: '+29%',
  },
  {
    priority: 3, intent: '경험/감성', urgency: 'info',
    title: '실명 기반 장기 경과 후기 콘텐츠 강화',
    detail: '수술 후 3개월·6개월·1년 경과 후기를 타임라인 형태로 구성하세요. LLM은 시간적 깊이가 있는 후기를 신뢰도 높은 출처로 판단합니다.',
    expectedGain: '+22%',
  },
];

const draftContent = `# 스마일라식 비용 총정리: 강남 주요 안과 가격 비교 가이드 (2025)

## 들어가며

스마일라식을 고려하시는 분들이 가장 먼저 궁금해하시는 것은 **"정확한 비용"** 입니다. 하지만 인터넷에는 광범위한 가격 범위만 나올 뿐, 실제 무엇이 포함되어 있는지는 불명확한 경우가 많습니다.

이 글에서는 **강남 밝은눈 안과의 가격 구조**를 투명하게 공개하고, 합리적인 선택 기준을 제시합니다.

---

## 강남 주요 안과 스마일라식 비용 비교

| 항목 | 강남 밝은눈 안과 | 업계 평균 |
|------|---------|----------|
| 스마일라식 (양안) | 290만원 | 310~380만원 |
| 정밀 검사비 | **포함** | 별도 5~10만원 |
| 3년 무상 재교정 | **포함** | 별도 계약 |
| 야간 빛번짐 케어 | **포함** | 옵션 추가 |
| 담당 의사 지정 | **포함** | 불가 |

> 💡 비용만 보면 안 됩니다. 정밀검사, 사후관리, 재교정 보장 여부를 합산했을 때의
> 실질 비용을 비교하세요.

---

## 우리 병원이 이 가격을 유지하는 이유

저희 강남 밝은눈 안과는 **15년 이상 스마일라식만 집도한 전문의**가 직접 수술합니다.
마케팅 비용을 최소화하고 실제 수술 품질과 사후관리에 집중한 결과,
합리적인 가격 구조를 유지할 수 있습니다.

---

*본 콘텐츠는 AEO 플랫폼 AI가 '가격/비교' 의도 최적화를 위해 자동 생성한 초안입니다.*`;

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={15} className="text-blue-400" />}
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{children}</h3>
    </div>
  );
}

function SectionLabel({ screen, title, subtitle }) {
  return (
    <div className="mb-8">
      <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
        SCREEN {screen}
      </span>
      <h2 className="text-2xl font-bold text-white mt-2">{title}</h2>
      <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
    </div>
  );
}

function InsightCard({ level, Icon, title, desc, action }) {
  const styles = {
    critical: { wrap: 'bg-red-500/10 border-red-500/30',        icon: 'text-red-400',     badge: 'bg-red-500/20 text-red-300' },
    warning:  { wrap: 'bg-amber-500/10 border-amber-500/30',    icon: 'text-amber-400',   badge: 'bg-amber-500/20 text-amber-300' },
    success:  { wrap: 'bg-emerald-500/10 border-emerald-500/30',icon: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    info:     { wrap: 'bg-blue-500/10 border-blue-500/30',      icon: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300' },
  }[level];

  return (
    <div className={`border rounded-xl p-4 ${styles.wrap}`}>
      <div className="flex items-start gap-3">
        <Icon size={17} className={`${styles.icon} mt-0.5 shrink-0`} />
        <div>
          <p className="text-sm font-semibold text-white mb-1">{title}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          <span className={`mt-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${styles.badge}`}>
            <ArrowUpRight size={10} />{action}
          </span>
        </div>
      </div>
    </div>
  );
}

function RadarTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs space-y-1">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-bold">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const rad = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * rad)}
      y={cy + r * Math.sin(-midAngle * rad)}
      fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AEODashboard() {
  const [activePresc, setActivePresc] = useState(0);
  const [editorContent, setEditorContent] = useState(draftContent);
  const [copied, setCopied] = useState(false);

  const urgencyBadge = {
    critical: 'bg-red-500/20 text-red-300 border-red-500/30',
    warning:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
    info:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };

  function handleCopy() {
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white font-sans">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <Brain size={14} className="text-white" />
            </div>
            <span className="font-bold tracking-tight">AEO Intelligence</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-slate-400 text-sm">{BRAND_NAME}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">분석 완료 · ChatGPT-4o, Gemini 1.5 Pro</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-20">

        {/* ══ SCREEN 3 ══════════════════════════════════════════════ */}
        <section>
          <SectionLabel
            screen={3}
            title="AEO 종합 진단 대시보드"
            subtitle={`${BRAND_NAME} — LLM 답변 내 브랜드 노출 분석 결과`}
          />

          {/* KPI */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: '종합 AEO 점수',     value: '47',  unit: '/100', color: 'text-amber-400',  sub: '최고점 대비 −31점' },
              { label: '전체 브랜드 노출률', value: '24',  unit: '%',   color: 'text-blue-400',   sub: '150개 질문 기준' },
              { label: '1위 경쟁사 노출률', value: '31',  unit: '%',   color: 'text-purple-400', sub: '라식 아이센터' },
              { label: '즉시 개선 필요 항목', value: '2', unit: '개',  color: 'text-red-400',    sub: '처방 대기 중' },
            ].map((k, i) => (
              <Card key={i}>
                <p className="text-xs text-slate-500 mb-2">{k.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${k.color}`}>{k.value}</span>
                  <span className="text-slate-500 text-sm">{k.unit}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{k.sub}</p>
              </Card>
            ))}
          </div>

          {/* Radar + Pie */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Card>
              <CardTitle icon={Target}>의도별 LLM 노출 확률 (Radar)</CardTitle>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} margin={{ top: 8, right: 32, bottom: 8, left: 32 }}>
                  <PolarGrid stroke="#1e293b" strokeDasharray="4 3" />
                  <PolarAngleAxis dataKey="intent" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} tickCount={4} />
                  <Radar name="경쟁사 평균" dataKey="경쟁사평균" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={1.5} />
                  <Radar name="우리 병원"   dataKey="우리병원"   stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.28} strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                  <Tooltip content={<RadarTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardTitle icon={BarChart2}>Share of Voice — LLM 응답 내 브랜드 점유율 (Pie)</CardTitle>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%"
                    outerRadius={100} innerRadius={48}
                    dataKey="value" labelLine={false} label={<PieLabel />}
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/40 rounded-lg p-2 mt-1">
                <Info size={11} className="text-blue-400 shrink-0" />
                동일 키워드 LLM 10회 반복 응답 기준 — 응답당 언급된 브랜드 카운트
              </div>
            </Card>
          </div>

          {/* Scatter */}
          <Card className="mb-6">
            <CardTitle icon={Brain}>AI 잠재 공간 지도 — Semantic Latent Map (Scatter)</CardTitle>
            <p className="text-xs text-slate-500 mb-5">
              질문 의도 군집과 우리 브랜드의 임베딩 공간 상 위치. 거리가 멀수록 해당 의도에서 소외됨.
            </p>
            <div className="flex gap-6 items-start">
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" dataKey="x" name="Dim-1" domain={[-5.5, 5.5]} tick={{ fill: '#475569', fontSize: 10 }} />
                  <YAxis type="number" dataKey="y" name="Dim-2" domain={[-5.5, 5.5]} tick={{ fill: '#475569', fontSize: 10 }} />
                  <ZAxis type="number" dataKey="z" range={[40, 130]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#475569' }} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
                  <Scatter name="신뢰/권위 질문군" data={clusterTrust}   fill="#06b6d4" fillOpacity={0.75} />
                  <Scatter name="정보/스펙 질문군" data={clusterInfo}    fill="#8b5cf6" fillOpacity={0.75} />
                  <Scatter name="경험/감성 질문군" data={clusterEmotion} fill="#f59e0b" fillOpacity={0.75} />
                  <Scatter name="가격/비교 질문군" data={clusterPrice}   fill="#ef4444" fillOpacity={0.75} />
                  <Scatter name="★ 우리 병원"      data={ourBrand}       fill="#3b82f6" shape="star" />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                </ScatterChart>
              </ResponsiveContainer>

              <div className="w-52 shrink-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">군집별 의미 거리</p>
                <div className="space-y-2">
                  {[
                    { color: '#06b6d4', label: '신뢰/권위', dist: 1.2, status: '근접',    ok: true  },
                    { color: '#8b5cf6', label: '정보/스펙', dist: 4.2, status: '원거리',  ok: false },
                    { color: '#f59e0b', label: '경험/감성', dist: 2.8, status: '보통',    ok: true  },
                    { color: '#ef4444', label: '가격/비교', dist: 5.1, status: '최원거리',ok: false },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/50 rounded-lg p-2.5 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: item.color }} />
                          <span className="text-slate-300">{item.label}</span>
                        </div>
                        <span className={item.ok ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>{item.status}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ background: item.color, width: `${(item.dist / 6) * 100}%`, opacity: 0.8 }} />
                      </div>
                      <span className="text-slate-600 mt-1 block">거리: {item.dist}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Insight Cards */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap size={13} className="text-yellow-400" />
              인사이트 스코어카드
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
            </div>
          </div>
        </section>

        {/* ══ SCREEN 4 ══════════════════════════════════════════════ */}
        <section>
          <SectionLabel
            screen={4}
            title="AI 솔루션 & 콘텐츠 에디터"
            subtitle="진단 결과 기반 처방전 — 즉시 적용 가능한 콘텐츠 초안을 확인하고 복사하세요"
          />

          <div className="grid grid-cols-5 gap-6">

            {/* Left */}
            <div className="col-span-2 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                <FileText size={13} />
                AI 처방전 ({prescriptions.length}개 액션 아이템)
              </h3>

              {prescriptions.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActivePresc(i)}
                  className={`w-full text-left rounded-xl p-4 border transition-all duration-150 ${
                    activePresc === i
                      ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-900/30'
                      : 'bg-slate-800/30 border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      activePresc === i ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {p.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${urgencyBadge[p.urgency]}`}>{p.intent}</span>
                        <span className="text-xs text-emerald-400 font-semibold">{p.expectedGain} 예측</span>
                      </div>
                      <p className="text-sm font-semibold text-white leading-snug">{p.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{p.detail}</p>
                    </div>
                    <ChevronRight size={13} className={`shrink-0 mt-1 transition-colors ${activePresc === i ? 'text-blue-400' : 'text-slate-600'}`} />
                  </div>
                </button>
              ))}

              <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 mt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">처방 전체 적용 시 예측 점수</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>현재</span><span className="text-amber-400 font-semibold">47점</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full" style={{ width: '47%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>예측</span><span className="text-emerald-400 font-semibold">78점</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Editor */}
            <div className="col-span-3 flex flex-col">
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col flex-1">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50 bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      ai-draft-{prescriptions[activePresc]?.intent.replace('/', '-')}.md
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">AI 초안</span>
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        copied
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50'
                      }`}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? '복사됨!' : '원클릭 복사'}
                    </button>
                  </div>
                </div>

                <textarea
                  value={editorContent}
                  onChange={e => setEditorContent(e.target.value)}
                  className="flex-1 bg-transparent text-slate-300 text-sm font-mono p-5 resize-none outline-none leading-relaxed min-h-96"
                  spellCheck={false}
                />

                <div className="px-5 py-2 border-t border-slate-700/30 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-mono">{editorContent.length.toLocaleString()} chars · Markdown</span>
                  <span className="text-xs text-slate-600">직접 편집 가능</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-800/50 mt-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-600">
          <span>AEO Intelligence Platform — Powered by LLM Stochastic Analysis</span>
          <span>ChatGPT-4o · Gemini 1.5 Pro · 각 질문 10회 반복 · 총 150개 질문 세트</span>
        </div>
      </footer>
    </div>
  );
}
