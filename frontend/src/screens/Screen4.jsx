import { useState } from 'react'
import { Copy, Check, ChevronRight, FileText, ArrowLeft } from 'lucide-react'
import NavBar from '../components/NavBar'

const prescriptions = [
  {
    priority: 1, intent: '가격/비교', urgency: 'critical',
    title: '스마일라식 가격 비교 정보성 콘텐츠 발행',
    detail: '타원장 대비 가격 구조와 포함 서비스를 명시한 "비교표" 포함 블로그를 발행하세요. LLM은 구조화된 정보(표, 목록)를 포함한 콘텐츠를 우선 인용합니다.',
    expectedGain: '+38%',
    draft: `# 스마일라식 비용 총정리: 강남 주요 안과 가격 비교 가이드 (2025)

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

*본 콘텐츠는 AEO 플랫폼 AI가 '가격/비교' 의도 최적화를 위해 자동 생성한 초안입니다.*`,
  },
  {
    priority: 2, intent: '정보/스펙', urgency: 'warning',
    title: '최신 장비 및 수술 방식 전문 페이지 구축',
    detail: '"VISX iDESIGN", "Contoura Vision" 등 장비명을 명시하고 각 수술 방식의 적합 대상을 표 형태로 정리한 전문 정보 페이지가 필요합니다.',
    expectedGain: '+29%',
    draft: `# 스마일라식 vs 라섹: 내 눈에 맞는 수술 방식 완전 비교 (2025)

## 수술 방식 한눈에 비교

| 항목 | 스마일라식 | 라섹 |
|------|---------|------|
| 각막 절개 방식 | 레이저 소절개 (2mm) | 상피 제거 후 레이저 |
| 회복 기간 | 1~2일 | 3~5일 |
| 건조증 위험 | 낮음 | 중간 |
| 고도근시 적합성 | ✅ 적합 | △ 조건부 |
| 사용 장비 | VISX iDESIGN | MEL90 Excimer |

## 강남 밝은눈 안과 보유 장비

- **VISX iDESIGN**: 눈의 고차수차까지 정밀 측정, 맞춤형 절삭 가능
- **Contoura Vision**: 각막 지형 기반 개인화 교정

---

*본 콘텐츠는 AEO 플랫폼 AI가 '정보/스펙' 의도 최적화를 위해 자동 생성한 초안입니다.*`,
  },
  {
    priority: 3, intent: '경험/감성', urgency: 'info',
    title: '실명 기반 장기 경과 후기 콘텐츠 강화',
    detail: '수술 후 3개월·6개월·1년 경과 후기를 타임라인 형태로 구성하세요. LLM은 시간적 깊이가 있는 후기를 신뢰도 높은 출처로 판단합니다.',
    expectedGain: '+22%',
    draft: `# 강남 밝은눈 안과 스마일라식 1년 후기 (직장인 김OO, 34세)

## 수술 전 고민

시력이 -5.5였고, 콘택트렌즈를 10년 넘게 착용해 각막 건강이 걱정됐습니다.
여러 병원을 비교하다 **15년 경력 전문의 직접 집도**와 **3년 무상 재교정** 조건에 이끌려 방문했습니다.

## 수술 당일 (D-day)

- 오전 10시 입실 → 11시 수술 완료 (15분 소요)
- 수술 중 통증 없음, 약간의 압박감만 느꼈습니다
- 귀가 후 4시간 수면 권고

## 경과 기록

| 시점 | 시력 | 특이사항 |
|------|------|---------|
| 수술 다음날 | 0.9 / 1.0 | 약간의 빛번짐 |
| 1개월 후 | 1.2 / 1.2 | 빛번짐 소멸 |
| 6개월 후 | 1.5 / 1.5 | 완전 안정 |
| 1년 후 | 1.5 / 1.5 | 건조증 전혀 없음 |

---

*본 콘텐츠는 AEO 플랫폼 AI가 '경험/감성' 의도 최적화를 위해 자동 생성한 초안입니다.*`,
  },
]

const urgencyBadge = {
  critical: 'bg-red-500/20 text-red-300 border-red-500/30',
  warning:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  info:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
}

export default function Screen4({ brandName, onBack }) {
  const [activePresc, setActivePresc] = useState(0)
  const [editorContent, setEditorContent] = useState(prescriptions[0].draft)
  const [copied, setCopied] = useState(false)

  function selectPresc(i) {
    setActivePresc(i)
    setEditorContent(prescriptions[i].draft)
    setCopied(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(editorContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      <NavBar brandName={brandName} currentStep={4} />

      <div className="max-w-7xl mx-auto px-6 py-10">

        <div className="grid grid-cols-5 gap-6">

          {/* Left: 처방전 */}
          <div className="col-span-2 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={13} />
              AI 처방전 ({prescriptions.length}개 액션 아이템)
            </h3>

            {prescriptions.map((p, i) => (
              <button
                key={i}
                onClick={() => selectPresc(i)}
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
                  <ChevronRight size={13} className={`shrink-0 mt-1 ${activePresc === i ? 'text-blue-400' : 'text-slate-600'}`} />
                </div>
              </button>
            ))}

            {/* Score prediction */}
            <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 mt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">처방 전체 적용 시 예측 점수</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">현재</span>
                    <span className="text-amber-400 font-semibold">47점</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full" style={{ width: '47%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">예측</span>
                    <span className="text-emerald-400 font-semibold">78점</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600 rounded-xl py-3 transition-all mt-2"
            >
              <ArrowLeft size={14} />
              대시보드로 돌아가기
            </button>
          </div>

          {/* Right: Editor */}
          <div className="col-span-3 flex flex-col">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col flex-1">
              {/* Editor header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50 bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    ai-draft-{prescriptions[activePresc].intent.replace('/', '-')}.md
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

              {/* Textarea */}
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
      </div>
    </div>
  )
}
