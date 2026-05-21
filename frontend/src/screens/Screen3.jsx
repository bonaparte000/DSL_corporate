import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Tooltip, Legend,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import {
  AlertTriangle, Target, Zap, AlertCircle,
  Lightbulb, Brain, Award, Info, ArrowUpRight, BarChart2,
} from 'lucide-react'
import NavBar from '../components/NavBar'

// ─── Dummy data ───────────────────────────────────────────────

const radarData = [
  { intent: '신뢰/권위',  우리병원: 72, 경쟁사평균: 55 },
  { intent: '정보/스펙',  우리병원: 28, 경쟁사평균: 68 },
  { intent: '경험/감성',  우리병원: 61, 경쟁사평균: 57 },
  { intent: '가격/비교',  우리병원: 15, 경쟁사평균: 74 },
  { intent: '추천형',     우리병원: 67, 경쟁사평균: 52 },
  { intent: '전문가형',   우리병원: 80, 경쟁사평균: 45 },
]

const pieData = [
  { name: '강남 밝은눈 안과', value: 24 },
  { name: '라식 아이센터',    value: 31 },
  { name: '강남 연세안과',    value: 22 },
  { name: '기타 경쟁사',      value: 23 },
]
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#334155']

const clusterTrust   = [{x:3.2,y:4.1,z:20},{x:3.8,y:3.7,z:18},{x:3.5,y:4.5,z:22},{x:4.0,y:4.2,z:16},{x:3.1,y:3.9,z:14}]
const clusterInfo    = [{x:-2.1,y:1.5,z:19},{x:-2.6,y:2.1,z:21},{x:-1.8,y:1.2,z:17},{x:-2.4,y:0.8,z:15},{x:-3.0,y:1.7,z:23}]
const clusterEmotion = [{x:0.5,y:-2.8,z:18},{x:1.2,y:-3.2,z:20},{x:-0.3,y:-2.5,z:16},{x:0.8,y:-3.8,z:22},{x:1.5,y:-2.2,z:14}]
const clusterPrice   = [{x:-3.5,y:-1.2,z:24},{x:-4.0,y:-0.8,z:19},{x:-3.2,y:-1.8,z:21},{x:-4.2,y:-1.5,z:17},{x:-3.8,y:-2.0,z:15}]
const ourBrand       = [{x:2.1,y:0.4,z:50}]

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
]

// ─── Sub-components ───────────────────────────────────────────

function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

function CardTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={15} className="text-blue-400" />}
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{children}</h3>
    </div>
  )
}

function InsightCard({ level, Icon, title, desc, action }) {
  const s = {
    critical: { wrap: 'bg-red-500/10 border-red-500/30',        icon: 'text-red-400',     badge: 'bg-red-500/20 text-red-300' },
    warning:  { wrap: 'bg-amber-500/10 border-amber-500/30',    icon: 'text-amber-400',   badge: 'bg-amber-500/20 text-amber-300' },
    success:  { wrap: 'bg-emerald-500/10 border-emerald-500/30',icon: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    info:     { wrap: 'bg-blue-500/10 border-blue-500/30',      icon: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300' },
  }[level]
  return (
    <div className={`border rounded-xl p-4 ${s.wrap}`}>
      <div className="flex items-start gap-3">
        <Icon size={16} className={`${s.icon} mt-0.5 shrink-0`} />
        <div>
          <p className="text-sm font-semibold text-white mb-1">{title}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          <span className={`mt-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${s.badge}`}>
            <ArrowUpRight size={10} />{action}
          </span>
        </div>
      </div>
    </div>
  )
}

function RadarTip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs space-y-1">
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

// ─── Main ─────────────────────────────────────────────────────

export default function Screen3({ brandName, onNext }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      <NavBar brandName={brandName} currentStep={3} />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">

        {/* KPI */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '종합 AEO 점수',      value: '47',  unit: '/100', color: 'text-amber-400',  sub: '최고점 대비 −31점' },
            { label: '전체 브랜드 노출률',  value: '24',  unit: '%',   color: 'text-blue-400',   sub: '150개 질문 기준' },
            { label: '1위 경쟁사 노출률',  value: '31',  unit: '%',   color: 'text-purple-400', sub: '라식 아이센터' },
            { label: '즉시 개선 필요 항목', value: '2',   unit: '개',  color: 'text-red-400',    sub: '처방 대기 중' },
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
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardTitle icon={Target}>의도별 LLM 노출 확률 (Radar)</CardTitle>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} margin={{ top: 8, right: 32, bottom: 8, left: 32 }}>
                <PolarGrid stroke="#1e293b" strokeDasharray="4 3" />
                <PolarAngleAxis dataKey="intent" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} tickCount={4} />
                <Radar name="경쟁사 평균" dataKey="경쟁사평균" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={1.5} />
                <Radar name="우리 병원"   dataKey="우리병원"   stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.28} strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                <Tooltip content={<RadarTip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <CardTitle icon={BarChart2}>Share of Voice — LLM 응답 내 브랜드 점유율</CardTitle>
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
              동일 키워드 LLM 10회 반복 응답 기준
            </div>
          </Card>
        </div>

        {/* Scatter */}
        <Card>
          <CardTitle icon={Brain}>AI 잠재 공간 지도 — Semantic Latent Map</CardTitle>
          <p className="text-xs text-slate-500 mb-4">
            질문 의도 군집과 우리 브랜드의 임베딩 공간 상 위치. 거리가 멀수록 해당 의도에서 소외됨.
          </p>
          <div className="flex gap-6 items-start">
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" dataKey="x" domain={[-5.5, 5.5]} tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis type="number" dataKey="y" domain={[-5.5, 5.5]} tick={{ fill: '#475569', fontSize: 10 }} />
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

            <div className="w-48 shrink-0 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">군집별 의미 거리</p>
              {[
                { color: '#06b6d4', label: '신뢰/권위', dist: 1.2, ok: true,  status: '근접'     },
                { color: '#8b5cf6', label: '정보/스펙', dist: 4.2, ok: false, status: '원거리'   },
                { color: '#f59e0b', label: '경험/감성', dist: 2.8, ok: true,  status: '보통'     },
                { color: '#ef4444', label: '가격/비교', dist: 5.1, ok: false, status: '최원거리' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/50 rounded-lg p-2.5 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-slate-300">{item.label}</span>
                    </div>
                    <span className={item.ok ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>{item.status}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ background: item.color, width: `${(item.dist / 6) * 100}%`, opacity: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Insight cards */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap size={13} className="text-yellow-400" />
            인사이트 스코어카드
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-end pt-4 pb-8">
          <button
            onClick={onNext}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 text-sm"
          >
            AI 처방 솔루션 확인하기
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
