import { useState, useEffect } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, LabelList,
  ResponsiveContainer,
} from 'recharts'
import {
  AlertTriangle, Target, Info, BarChart2, Sparkles, ArrowRight, Globe,
} from 'lucide-react'
import NavBar from '../components/NavBar'

// ─── Fallback dummy data ──────────────────────────────────────────────────────

const DUMMY_RADAR = [
  { intent: '스마일라식',      우리브랜드: 72, 경쟁사평균: 55 },
  { intent: '라섹',            우리브랜드: 28, 경쟁사평균: 68 },
  { intent: '백내장 수술',     우리브랜드: 61, 경쟁사평균: 57 },
  { intent: '노안 교정술',     우리브랜드: 15, 경쟁사평균: 74 },
  { intent: '안구건조증 치료', 우리브랜드: 67, 경쟁사평균: 52 },
]

const DUMMY_PIE = [
  { name: '추천형', value: 27 },
  { name: '비교형', value: 31 },
  { name: '후기형', value: 22 },
  { name: '전문가형', value: 20 },
]

const DUMMY_FEATURES = [
  { feature: '스마일라식 | 추천형', score: 0.38 },
  { feature: '백내장 수술 | 후기형', score: 0.29 },
  { feature: '라섹 | 비교형', score: 0.22 },
  { feature: '노안 교정술 | 전문가형', score: 0.18 },
  { feature: '스마일라식 | 비교형', score: 0.15 },
]

const DUMMY_KPI = {
  brand_exposure_rate: 24,
  top_competitor_rate: 85,
  top_competitor_name: '강남스마일안과',
  total_questions: 970,
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b']

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  )
}

function CardTitle({ icon: Icon, children, color = 'text-blue-400' }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={15} className={color} />}
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{children}</h3>
    </div>
  )
}

function RadarTip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-3 text-xs space-y-1.5 shadow-xl">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-bold">{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.07) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const rad = Math.PI / 180
  return (
    <text
      x={cx + r * Math.cos(-midAngle * rad)}
      y={cy + r * Math.sin(-midAngle * rad)}
      fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Screen3({ brandName, results, onNext }) {
  const kpi           = results?.kpi           ?? DUMMY_KPI
  const radarData     = results?.radar          ?? DUMMY_RADAR
  const pieData       = results?.pie            ?? DUMMY_PIE
  const topFeatures   = results?.top_features   ?? DUMMY_FEATURES
  const similarBrands = results?.similar_brands ?? []
  const isDummy       = !results

  const featureChartData = topFeatures.slice(0, 8).map(f => ({
    feature: f.feature,
    score:   Math.round(f.score * 100),
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      <NavBar
        brandName={brandName}
        currentStep={3}
        onStepClick={(s) => s === 4 && onNext?.()}
      />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-5">

        {/* Brand not found warning */}
        {results && !results.brand_found && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              <strong>{brandName}</strong>이 LLM 응답에서 발견되지 않았습니다.
              파이프라인 데이터에 해당 브랜드가 포함되어 있는지 확인하세요.
            </span>
          </div>
        )}

        {/* Dummy data notice */}
        {isDummy && (
          <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
            <Info size={16} className="shrink-0" />
            <span>백엔드가 연결되지 않아 예시 데이터를 표시합니다. run_analysis.py 실행 후 백엔드를 시작하면 실제 분석 결과가 표시됩니다.</span>
          </div>
        )}

        {/* KPI — 2 cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
            <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">전체 데이터 내 점유율</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-blue-400">{kpi.brand_exposure_rate}</span>
              <span className="text-slate-400 text-lg font-light">%</span>
            </div>
            <p className="text-xs text-slate-600">{kpi.total_questions || 970}개 LLM 응답 기준</p>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
            <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">최유사 경쟁사 유사도</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-purple-400">{kpi.top_competitor_rate}</span>
              <span className="text-slate-400 text-lg font-light">%</span>
            </div>
            <p className="text-xs text-slate-600">{kpi.top_competitor_name || '-'}</p>
          </Card>
        </div>

        {/* Radar + Pie */}
        <div className="grid grid-cols-5 gap-5">
          <Card className="col-span-3">
            <CardTitle icon={Target}>시술별 LLM 언급 비율</CardTitle>
            <ResponsiveContainer width="100%" height={290}>
              <RadarChart data={radarData} margin={{ top: 8, right: 32, bottom: 8, left: 32 }}>
                <PolarGrid stroke="#1e293b" strokeDasharray="4 3" />
                <PolarAngleAxis dataKey="intent" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} tickCount={4} />
                <Radar name="경쟁사 평균" dataKey="경쟁사평균" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={1.5} />
                <Radar name="우리 브랜드" dataKey="우리브랜드" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.28} strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                <Tooltip content={<RadarTip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="col-span-2">
            <CardTitle icon={BarChart2}>질문 유형별 언급 비율</CardTitle>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  outerRadius={90} innerRadius={44}
                  dataKey="value" labelLine={false} label={<PieLabel />}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, name) => [`${v}%`, name]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-900/40 rounded-lg p-2.5 mt-1">
              <Info size={11} className="text-blue-400 shrink-0 mt-0.5" />
              TF-IDF 기반 · 해당 브랜드의 언급 유형 분포
            </div>
          </Card>
        </div>

        {/* 핵심 강점 */}
        <Card>
          <CardTitle icon={Sparkles} color="text-amber-400">
            브랜드 핵심 강점 — TF-IDF 임베딩 가중치 (시술 × 질문 유형)
          </CardTitle>
          {featureChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={featureChartData.length * 36 + 16}>
                <BarChart
                  data={featureChartData}
                  layout="vertical"
                  margin={{ top: 0, right: 56, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category" dataKey="feature"
                    tick={{ fill: '#94a3b8', fontSize: 11 }} width={175}
                    tickLine={false} axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                    formatter={(v) => [`${v}`, 'TF-IDF 강점 점수 (×100)']}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                    {featureChartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={`hsl(${38 + i * 4}, ${90 - i * 4}%, ${60 - i * 3}%)`}
                        fillOpacity={1 - i * 0.08}
                      />
                    ))}
                    <LabelList dataKey="score" position="right" style={{ fill: '#94a3b8', fontSize: 10 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-600 mt-2">
                LLM 응답에서 해당 브랜드가 어떤 시술×유형 조합에서 두드러지게 언급되는지 나타냅니다.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-600 text-center py-6">브랜드 데이터가 없습니다.</p>
          )}
        </Card>

        {/* 유사 경쟁사 */}
        {similarBrands.length > 0 && (
          <Card>
            <CardTitle icon={BarChart2}>포지셔닝 유사 경쟁사 Top 5 — TF-IDF 코사인 유사도</CardTitle>
            <div className="space-y-2.5">
              {similarBrands.map((b, i) => {
                const pct = Math.round(b.similarity * 100)
                return (
                  <div key={i} className="flex items-center gap-3 group">
                    <span className="text-xs text-slate-600 w-4 font-mono">{i + 1}</span>
                    <span className="text-sm text-slate-200 flex-1 group-hover:text-white transition-colors">{b.name}</span>
                    <div className="w-36 bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right font-mono">{pct}%</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              시술×유형 벡터 공간에서 가장 가까운 브랜드 — 포지셔닝 전략이 유사할수록 직접 경쟁 관계
            </p>
          </Card>
        )}

        {/* URL 분석 진입 카드 */}
        <button
          onClick={onNext}
          className="w-full group relative overflow-hidden bg-gradient-to-br from-purple-900/30 to-slate-800/40 border border-purple-500/30 hover:border-purple-400/60 rounded-2xl p-6 text-left transition-all duration-200 hover:bg-purple-900/40"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full -translate-y-12 translate-x-12 pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <Globe size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">출처 URL 임베딩 분석</p>
                <p className="text-xs text-slate-400 mt-0.5">12,447건의 LLM 인용 URL을 멀티모달 3D 시각화로 탐색</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300 transition-colors">
              <span className="text-xs font-medium">URL 분석 보기</span>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </button>

      </div>
    </div>
  )
}
