import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Cell, LabelList, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ExternalLink, Globe, Layers, Search, Zap, Info, ArrowUpRight } from 'lucide-react'
import NavBar from '../components/NavBar'

const CAT_COLORS = {
  'Hospital/Clinic': '#818cf8',
  'Other Web':       '#94a3b8',
  'YouTube':         '#f87171',
  'Tistory Blog':    '#fb923c',
  'News Media':      '#a78bfa',
  'Public/Gov':      '#67e8f9',
  'DC Inside':       '#60a5fa',
  'Google API':      '#fbbf24',
}

const QT_COLORS = {
  '비교형':   '#3b82f6',
  '후기형':   '#8b5cf6',
  '전문가형': '#06b6d4',
  '추천형':   '#f59e0b',
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  )
}

function CardTitle({ icon: Icon, children, color = 'text-purple-400' }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={15} className={color} />}
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{children}</h3>
    </div>
  )
}

function StatCard({ value, label, sub, color = 'text-purple-400', icon: Icon }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-6 translate-x-6 pointer-events-none" />
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        {Icon && <Icon size={14} className="text-slate-600" />}
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </Card>
  )
}

function BarTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-bold">{payload[0].value.toLocaleString()}건</p>
    </div>
  )
}

export default function Screen4({ brandName, onNavigate }) {
  const [urlData, setUrlData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mapExpanded, setMapExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/url-analysis')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setUrlData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const catData = urlData?.category_distribution.slice(0, 6) ?? []
  const qtData  = urlData
    ? [...urlData.query_type_stats].sort((a, b) => b.citations - a.citations)
    : []
  const topQuery  = qtData[0]?.query_type ?? '-'
  const catCount  = urlData?.category_distribution.length ?? 0
  const maxDScore = qtData.length ? Math.max(...qtData.map(d => d.diversity_score)) : 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white">
      <NavBar brandName={brandName} currentStep={4} onStepClick={onNavigate} />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-white">출처 URL 임베딩 분석</h1>
            <p className="text-xs text-slate-500 mt-1">
              Vertex AI LLM 인용 URL을 멀티모달 임베딩(텍스트 70% + 이미지 30%) → UMAP 3D로 맵핑
            </p>
          </div>
          <a
            href="/static/multimodal_latent_space.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-400/50 bg-purple-500/10 hover:bg-purple-500/15 px-4 py-2 rounded-xl transition-all"
          >
            <ArrowUpRight size={13} />
            3D 확률공간 새 탭으로 열기
          </a>
        </div>

        {loading && (
          <Card className="text-center py-12">
            <p className="text-slate-500 text-sm animate-pulse">URL 분석 데이터 로딩 중...</p>
          </Card>
        )}

        {!loading && !urlData && (
          <Card className="flex items-center gap-3 text-amber-300 text-sm">
            <Info size={16} className="shrink-0" />
            <span>URL 분석 데이터를 불러올 수 없습니다. 백엔드가 실행 중인지 확인하세요.</span>
          </Card>
        )}

        {urlData && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                icon={Globe}
                label="총 인용 URL"
                value={urlData.total_citations.toLocaleString()}
                sub="Vertex AI 응답 내 출처 합계"
                color="text-purple-400"
              />
              <StatCard
                icon={Layers}
                label="인용 카테고리"
                value={`${catCount}가지`}
                sub="병원·유튜브·블로그 등"
                color="text-blue-400"
              />
              <StatCard
                icon={Search}
                label="최다 인용 쿼리 유형"
                value={topQuery}
                sub={`${qtData[0]?.citations.toLocaleString() ?? 0}건`}
                color="text-cyan-400"
              />
              <StatCard
                icon={Zap}
                label="최고 다양성 점수"
                value={maxDScore.toFixed(2)}
                sub="후기형 쿼리 공간 분산도"
                color="text-emerald-400"
              />
            </div>

            {/* Category chart + Query type diversity */}
            <div className="grid grid-cols-5 gap-5">
              <Card className="col-span-3">
                <CardTitle icon={Globe}>LLM 정보 출처 선호도 — 카테고리별 인용 횟수</CardTitle>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={catData}
                    layout="vertical"
                    margin={{ top: 0, right: 70, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category" dataKey="label"
                      tick={{ fill: '#94a3b8', fontSize: 10 }} width={130}
                      tickLine={false} axisLine={false}
                    />
                    <Tooltip content={<BarTip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                      {catData.map((d) => (
                        <Cell key={d.category} fill={CAT_COLORS[d.category] ?? '#64748b'} fillOpacity={0.85} />
                      ))}
                      <LabelList
                        dataKey="pct"
                        position="right"
                        formatter={(v) => `${v}%`}
                        style={{ fill: '#64748b', fontSize: 10 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-slate-600 mt-2">
                  병원·의원 공식 사이트가 절반 이상 — LLM이 1차 출처로 병원 자체 사이트를 선호합니다
                </p>
              </Card>

              <Card className="col-span-2">
                <CardTitle icon={Zap} color="text-cyan-400">쿼리 유형별 다양성 점수</CardTitle>
                <div className="space-y-3.5 mt-1">
                  {qtData.map((d) => {
                    const color = QT_COLORS[d.query_type] ?? '#64748b'
                    const pct   = (d.diversity_score / maxDScore) * 100
                    return (
                      <div key={d.query_type} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-md"
                            style={{ background: color + '22', color }}
                          >
                            {d.query_type}
                          </span>
                          <div className="text-right">
                            <span className="text-xs text-slate-300 font-mono">{d.diversity_score.toFixed(2)}</span>
                            <span className="text-xs text-slate-600 ml-1">· {d.citations.toLocaleString()}건</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-800/80 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                  값이 높을수록 다양한 클러스터에 걸쳐 분산<br />
                  낮을수록 동질 문서 집중 인용
                </p>
              </Card>
            </div>

            {/* Master sources */}
            <Card>
              <CardTitle icon={ExternalLink}>쿼리 유형별 마스터 소스 — 3D 중심점 최근접 문서</CardTitle>
              <div className="overflow-hidden rounded-xl border border-slate-700/40">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-700/40">
                      <th className="text-left px-4 py-2.5 text-slate-500 font-medium w-24">유형</th>
                      <th className="text-left px-4 py-2.5 text-slate-500 font-medium w-36">카테고리</th>
                      <th className="text-left px-4 py-2.5 text-slate-500 font-medium">대표 도메인</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urlData.master_sources.map((m, i) => (
                      <tr key={i} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <span
                            className="font-semibold px-2 py-0.5 rounded-md text-xs"
                            style={{
                              background: (QT_COLORS[m.query_type] ?? '#64748b') + '22',
                              color: QT_COLORS[m.query_type] ?? '#94a3b8',
                            }}
                          >
                            {m.query_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{m.category}</td>
                        <td className="px-4 py-3">
                          <a
                            href={m.url} target="_blank" rel="noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors group"
                          >
                            <span>{m.domain}</span>
                            <ExternalLink size={10} className="shrink-0 opacity-60 group-hover:opacity-100" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                3D 임베딩 공간에서 각 쿼리 유형 클러스터의 무게중심에 가장 가까운 URL — 해당 유형을 대표하는 핵심 출처
              </p>
            </Card>

            {/* 3D Map */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe size={15} className="text-purple-400" />
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">멀티모달 3D 시맨틱 맵 — URL 임베딩 확률 공간</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMapExpanded(v => !v)}
                    className="text-xs text-slate-400 hover:text-slate-300 border border-slate-700/50 hover:border-slate-600 px-3 py-1 rounded-lg transition-colors"
                  >
                    {mapExpanded ? '접기' : '인라인 열기'}
                  </button>
                  <a
                    href="/static/multimodal_latent_space.html"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-400/50 px-3 py-1 rounded-lg transition-colors"
                  >
                    <ArrowUpRight size={11} />
                    새 탭
                  </a>
                </div>
              </div>

              {mapExpanded ? (
                <iframe
                  src="/static/multimodal_latent_space.html"
                  className="w-full rounded-xl border border-purple-500/20"
                  style={{ height: 580 }}
                  title="3D Semantic Source Map"
                  loading="lazy"
                />
              ) : (
                <div
                  className="relative w-full rounded-xl border border-purple-500/20 bg-slate-900/60 flex flex-col items-center justify-center cursor-pointer group hover:border-purple-400/40 transition-colors"
                  style={{ height: 200 }}
                  onClick={() => setMapExpanded(true)}
                >
                  <div className="absolute inset-0 overflow-hidden rounded-xl opacity-20 pointer-events-none">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full border border-purple-500/40"
                        style={{
                          width: `${(i + 1) * 70}px`,
                          height: `${(i + 1) * 70}px`,
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    ))}
                  </div>
                  <Globe size={30} className="text-purple-400/50 mb-3 group-hover:text-purple-400/80 transition-colors" />
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">클릭하여 3D 맵 로드</p>
                  <p className="text-xs text-slate-600 mt-1">~6.5 MB · 약 12,447개 URL 포인트</p>
                </div>
              )}

              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-900/40 rounded-lg p-3 mt-4">
                <Info size={11} className="text-purple-400 shrink-0 mt-0.5" />
                <span>
                  SentenceTransformer (텍스트 의미) + ResNet50 (이미지 특징) 결합 → UMAP 3차원 압축 →
                  HDBSCAN 클러스터링. 각 점은 하나의 URL 출처를 나타내며, 가까울수록 내용·디자인이 유사합니다.
                </span>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
