import { useState } from 'react'
import { Search, Brain, BarChart2, Network, Globe } from 'lucide-react'

const EXAMPLES = ['강남스마일안과', '비앤빛', '아이리움안과']

export default function Screen1({ onSubmit }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (value.trim()) onSubmit(value.trim())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Brain size={22} className="text-white" />
        </div>
        <div>
          <span className="text-2xl font-bold text-white tracking-tight">AEO Intelligence</span>
          <p className="text-xs text-blue-400/70 tracking-widest uppercase mt-0.5">Answer Engine Optimization</p>
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-4xl font-bold text-white text-center leading-tight mb-4">
        AI 답변 엔진에서<br />
        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">당신의 브랜드</span>를 찾게 하세요
      </h1>
      <p className="text-slate-400 text-center text-sm mb-10 max-w-lg leading-relaxed">
        ChatGPT · Gemini 등 LLM이 어떤 질문에서 당신의 브랜드를 언급하는지<br />
        TF-IDF 임베딩으로 분석하고 경쟁 포지셔닝을 진단합니다
      </p>

      {/* Search */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="병원·브랜드명을 입력하세요  (예: 강남스마일안과)"
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-2xl py-4 pl-11 pr-36 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:bg-slate-800/80 text-sm transition-all"
            autoFocus
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            분석 시작 →
          </button>
        </div>
      </form>

      {/* Example tags */}
      <div className="flex gap-2 mt-4 flex-wrap justify-center items-center">
        <span className="text-xs text-slate-600">예시:</span>
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            type="button"
            onClick={() => setValue(ex)}
            className="text-xs text-slate-400 border border-slate-700/50 px-3 py-1.5 rounded-full hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-3 gap-4 mt-14 max-w-xl w-full">
        {[
          { icon: BarChart2, title: '시술별 노출 분석',  desc: 'TF-IDF 임베딩 기반\n시술 × 유형 언급 비율 진단' },
          { icon: Network,   title: '경쟁 포지셔닝 맵', desc: '코사인 유사도로\n직접 경쟁사 자동 탐지' },
          { icon: Globe,     title: 'URL 임베딩 분석',  desc: 'LLM 인용 출처 패턴\n멀티모달 3D 분석' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 text-center hover:border-slate-600/50 transition-colors">
            <Icon size={18} className="text-blue-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300 mb-1">{title}</p>
            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
