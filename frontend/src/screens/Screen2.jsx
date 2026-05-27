import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Loader2, Brain, AlertCircle } from 'lucide-react'

const STEPS = [
  { text: 'LLM 응답 데이터 로드 및 브랜드 추출',                          ms: 900  },
  { text: '브랜드 × 시술 · 속성 컨텍스트 행렬 구성',                      ms: 1000 },
  { text: 'TF-IDF 변환으로 브랜드 임베딩 벡터 생성',                      ms: 1300 },
  { text: '코사인 유사도 계산 — 경쟁사 포지셔닝 분석 중',                 ms: 2000 },
  { text: '시술별 · 속성별 언급 비율 산출',                               ms: 1100 },
  { text: '진단 완료 — 대시보드 생성 중',                                  ms: 700  },
]
const TOTAL_MS = STEPS.reduce((s, step) => s + step.ms, 0)

export default function Screen2({ brandName, onDone }) {
  const [doneSteps, setDoneSteps] = useState(new Set())
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [animDone, setAnimDone] = useState(false)
  const [apiResult, setApiResult] = useState(undefined) // undefined = pending, null = error
  const [apiError, setApiError] = useState('')

  // Refs to avoid stale closures in effect
  const animDoneRef = useRef(false)
  const apiResultRef = useRef(undefined)

  function tryTransition() {
    if (animDoneRef.current && apiResultRef.current !== undefined) {
      setTimeout(() => onDone(apiResultRef.current), 400)
    }
  }

  // Animation timers
  useEffect(() => {
    let elapsed = 0
    STEPS.forEach((step, i) => {
      setTimeout(() => setActiveStep(i), elapsed)
      elapsed += step.ms
      const snap = elapsed
      setTimeout(() => {
        setDoneSteps(prev => new Set([...prev, i]))
        setProgress(Math.round((snap / TOTAL_MS) * 100))
        if (i === STEPS.length - 1) {
          animDoneRef.current = true
          setAnimDone(true)
          tryTransition()
        }
      }, snap)
    })
  }, []) // eslint-disable-line

  // API call
  useEffect(() => {
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: brandName }),
    })
      .then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.detail || '서버 오류') })
        return r.json()
      })
      .then(data => {
        apiResultRef.current = data
        setApiResult(data)
        tryTransition()
      })
      .catch(err => {
        // API 실패 시 null로 설정 → Screen3는 더미 데이터 사용
        apiResultRef.current = null
        setApiResult(null)
        setApiError(err.message)
        tryTransition()
      })
  }, [brandName]) // eslint-disable-line

  const waitingForApi = animDone && apiResult === undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center px-6">

      {/* Logo */}
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
            <span className="text-slate-500">
              {waitingForApi ? '서버 응답 대기 중...' : '분석 진행률'}
            </span>
            <span className="text-blue-400 font-mono font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {waitingForApi && (
            <p className="text-xs text-slate-600 mt-2 text-center animate-pulse">
              파이프라인 결과를 불러오는 중...
            </p>
          )}
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

        {/* API error notice (non-blocking) */}
        {apiError && (
          <div className="mt-6 flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>백엔드 연결 실패: {apiError} — 예시 데이터로 진행합니다.</span>
          </div>
        )}
      </div>
    </div>
  )
}
