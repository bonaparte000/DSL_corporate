import { useState, useEffect } from 'react'
import { CheckCircle2, Loader2, Brain } from 'lucide-react'

const STEPS = [
  { text: '브랜드 정보 수신 및 지역/업종 자동 매핑',                 ms: 900  },
  { text: '평가 프레임 분류 (신뢰 · 정보 · 경험)',                   ms: 1000 },
  { text: '150개 가설 질문 세트 자동 생성 중',                       ms: 1300 },
  { text: 'ChatGPT-4o / Gemini 1.5 Pro 병렬 호출 중 (각 10회)',     ms: 2000 },
  { text: '응답 데이터 임베딩 벡터 변환 중',                         ms: 1100 },
  { text: '의도별 군집 분석 및 브랜드 노출 패턴 계산 중',            ms: 1400 },
  { text: '진단 완료 — 대시보드 생성 중',                           ms: 700  },
]
const TOTAL_MS = STEPS.reduce((s, step) => s + step.ms, 0)

export default function Screen2({ brandName, onDone }) {
  const [doneSteps, setDoneSteps] = useState(new Set())
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let elapsed = 0

    STEPS.forEach((step, i) => {
      // activate step
      setTimeout(() => setActiveStep(i), elapsed)

      // complete step + update progress
      elapsed += step.ms
      const snap = elapsed
      setTimeout(() => {
        setDoneSteps(prev => new Set([...prev, i]))
        setProgress(Math.round((snap / TOTAL_MS) * 100))
        if (i === STEPS.length - 1) setTimeout(onDone, 500)
      }, snap)
    })
  }, []) // eslint-disable-line

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center px-6">

      {/* Logo small */}
      <div className="flex items-center gap-2 mb-12 opacity-50">
        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
          <Brain size={12} className="text-white" />
        </div>
        <span className="text-sm font-bold text-white">AEO Intelligence</span>
      </div>

      <div className="w-full max-w-lg">
        {/* Brand name */}
        <div className="text-center mb-10">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">분석 대상</p>
          <h2 className="text-2xl font-bold text-white">{brandName}</h2>
        </div>

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-500">분석 진행률</span>
            <span className="text-blue-400 font-mono font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-3.5">
          {STEPS.map((step, i) => {
            const done   = doneSteps.has(i)
            const active = activeStep === i && !done
            const future = i > activeStep

            return (
              <div
                key={i}
                className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                  future ? 'opacity-20' : 'opacity-100'
                }`}
              >
                {done ? (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                ) : active ? (
                  <Loader2 size={16} className="text-blue-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className={
                  done   ? 'text-slate-500 line-through' :
                  active ? 'text-white font-medium'      :
                           'text-slate-600'
                }>
                  {step.text}
                </span>
                {done && (
                  <span className="text-xs text-emerald-500 font-mono ml-auto">완료</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
