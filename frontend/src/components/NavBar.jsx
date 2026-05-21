import { Brain } from 'lucide-react'

const STEPS = [
  { n: 1, label: '브랜드 입력' },
  { n: 2, label: '분석 중' },
  { n: 3, label: '진단 대시보드' },
  { n: 4, label: '솔루션 에디터' },
]

export default function NavBar({ brandName, currentStep }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo + brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <Brain size={14} className="text-white" />
          </div>
          <span className="font-bold tracking-tight text-white">AEO Intelligence</span>
          <span className="text-slate-600 mx-1">/</span>
          <span className="text-slate-400 text-sm">{brandName}</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => {
            const done    = step.n < currentStep
            const active  = step.n === currentStep
            const future  = step.n > currentStep

            return (
              <div key={step.n} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  active  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                  done    ? 'text-slate-500' :
                            'text-slate-700'
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    active ? 'bg-blue-500 text-white' :
                    done   ? 'bg-slate-600 text-slate-300' :
                             'bg-slate-800 text-slate-600'
                  }`}>
                    {done ? '✓' : step.n}
                  </span>
                  <span className={future ? 'hidden sm:inline' : ''}>{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-px ${done ? 'bg-slate-600' : 'bg-slate-800'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-slate-400">분석 완료</span>
        </div>
      </div>
    </nav>
  )
}
