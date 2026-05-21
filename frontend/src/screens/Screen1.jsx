import { useState } from 'react'
import { Search, Brain, Zap } from 'lucide-react'

const EXAMPLES = ['강남 밝은눈 안과', '청담 뷰티 클리닉', '논현 연세치과']

export default function Screen1({ onSubmit }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (value.trim()) onSubmit(value.trim())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center px-6">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-14">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Brain size={20} className="text-white" />
        </div>
        <span className="text-2xl font-bold text-white tracking-tight">AEO Intelligence</span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl font-bold text-white text-center leading-tight mb-4">
        AI 답변 엔진에서<br />
        <span className="text-blue-400">당신의 브랜드</span>를 찾게 하세요
      </h1>
      <p className="text-slate-400 text-center text-sm mb-12 max-w-md leading-relaxed">
        ChatGPT · Gemini 등 LLM이 어떤 질문에서 당신의 브랜드를 언급하는지<br />
        데이터 기반으로 분석하고 최적 콘텐츠 전략을 제안합니다
      </p>

      {/* Search */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="브랜드명 또는 병원명을 입력하세요"
            className="w-full bg-slate-800/70 border border-slate-700/80 rounded-2xl py-4 pl-11 pr-36 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/70 focus:bg-slate-800 text-sm transition-all"
            autoFocus
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all"
          >
            분석 시작 →
          </button>
        </div>
      </form>

      {/* Example tags */}
      <div className="flex gap-2 mt-5 flex-wrap justify-center">
        <span className="text-xs text-slate-600 self-center">예시:</span>
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            type="button"
            onClick={() => setValue(ex)}
            className="text-xs text-slate-400 border border-slate-700/60 px-3 py-1.5 rounded-full hover:border-blue-500/60 hover:text-blue-400 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Feature hints */}
      <div className="flex gap-6 mt-16 text-xs text-slate-600">
        {[
          '의도별 노출 확률 분석',
          'Share of Voice 경쟁 지형',
          'AI 콘텐츠 처방전 자동 생성',
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Zap size={11} className="text-blue-500/60" />
            {f}
          </div>
        ))}
      </div>
    </div>
  )
}
