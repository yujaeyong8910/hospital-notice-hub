import { Header } from '@/components/layout/Header'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { BookOpen, Scale, FileText, HelpCircle } from 'lucide-react'

const quickQuestions = [
  { icon: BookOpen, text: '요양급여 청구 시 주의사항을 알려주세요' },
  { icon: Scale, text: '건강보험 심사청구 기준이 변경된 사항이 있나요?' },
  { icon: FileText, text: '입원환자 식대 급여 기준을 설명해 주세요' },
  { icon: HelpCircle, text: '선택진료비 폐지 이후 변경된 청구 방식은?' },
]

export default function AIPage() {
  return (
    <>
      <Header
        title="AI 어시스턴트"
        subtitle="원무팀·심사팀 전문 의료행정 AI"
      />
      <main className="flex-1 overflow-hidden bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto h-full flex flex-col gap-4">
          {/* Quick questions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            {quickQuestions.map(({ icon: Icon, text }) => (
              <button
                key={text}
                className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-gray-200 text-left hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <Icon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <span className="text-xs text-gray-600 group-hover:text-gray-900 leading-relaxed">{text}</span>
              </button>
            ))}
          </div>

          {/* Chat panel */}
          <div className="flex-1 min-h-0">
            <ChatPanel placeholder="건강보험 청구, 심사기준, 법령 해석 등 업무 관련 질문을 입력하세요..." />
          </div>

          <p className="text-center text-xs text-gray-400 shrink-0">
            AI 답변은 참고용입니다. 중요한 사항은 반드시 관련 기관에 확인하세요.
          </p>
        </div>
      </main>
    </>
  )
}
