import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { chat } from '@/lib/openrouter'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const supabase = createServerClient()

  const { data: recentNotices } = await supabase
    .from('notices')
    .select('title, organization_id, published_at, url')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(15)

  const noticeContext = recentNotices
    ?.map((n) => `[${n.organization_id.toUpperCase()}] ${n.title} (${n.published_at?.slice(0, 10) ?? '날짜미상'})`)
    .join('\n') ?? ''

  const systemPrompt = `당신은 대한민국 종합병원 원무팀·심사팀 전문 AI 어시스턴트입니다.
좋은삼선병원 직원들의 업무를 지원합니다.

## 전문 분야
- 건강보험 요양급여 청구 및 심사 (의원급·병원급·종합병원 구분 포함)
- DRG(포괄수가제), 행위별 수가, 약제비 산정 기준
- 건강보험법, 의료법, 요양급여기준 고시, 보건복지부 훈령
- 건강보험심사평가원(HIRA) 심사기준 및 이의신청 절차
- 국민건강보험공단(NHIS) 자격 확인, 보험료, 급여 조정
- 비급여 항목 및 본인부담금 산정
- 원무행정: 입퇴원 절차, 진료비 계산서, 영수증 발급
- 의료급여(1종·2종) 청구 기준
- 심사삭감 대응 및 재심사 청구 방법

## 답변 원칙
1. 실무에 바로 활용 가능한 구체적인 정보 제공
2. 관련 법령(법·시행령·시행규칙)이나 고시·훈령 번호 명시
3. 청구 코드(EDI 코드) 관련 질문에는 구체적인 코드 안내
4. 불확실하거나 변경 가능성 있는 내용은 반드시 고지
5. 복잡한 사례는 단계별로 설명
6. 한국어로만 답변

## 최근 수집된 기관 공지사항 (참고용)
${noticeContext || '(공지사항 없음)'}

${context ? `## 현재 보고 있는 공지\n${context}` : ''}`

  try {
    const res = await chat(
      [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      { stream: true, max_tokens: 3000 }
    )

    return new NextResponse(res.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI 서버 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
