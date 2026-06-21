import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { chat } from '@/lib/openrouter'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const supabase = createServerClient()

  // fetch recent notices for context
  const { data: recentNotices } = await supabase
    .from('notices')
    .select('title, organization_id, published_at, url')
    .order('published_at', { ascending: false })
    .limit(10)

  const noticeContext = recentNotices
    ?.map((n) => `[${n.organization_id.toUpperCase()}] ${n.title} (${n.published_at?.slice(0, 10) ?? '날짜미상'})`)
    .join('\n') ?? ''

  const systemPrompt = `당신은 대한민국 종합병원 원무팀·심사팀 전문 AI 어시스턴트입니다.
건강보험 청구, 요양급여기준, 심사평가, 건강보험법 등 의료행정 분야 전문 지식을 보유하고 있습니다.

최근 공지사항 (참고용):
${noticeContext}

${context ? `현재 보고 있는 공지: ${context}` : ''}

답변 원칙:
- 실무에 바로 활용 가능한 구체적인 답변
- 관련 법령이나 고시 번호 언급
- 불확실한 내용은 명확히 고지
- 한국어로만 답변`

  const res = await chat(
    [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    { stream: true, max_tokens: 2000 }
  )

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
