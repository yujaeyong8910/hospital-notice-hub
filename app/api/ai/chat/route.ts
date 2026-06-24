import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { chat } from '@/lib/openrouter'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const supabase = createServerClient()

  // 최근 공지 목록 (제목만)
  const { data: recentNotices } = await supabase
    .from('notices')
    .select('title, organization_id, published_at')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(10)

  const recentList = recentNotices
    ?.map((n) => `[${n.organization_id.toUpperCase()}] ${n.title} (${n.published_at?.slice(0, 10) ?? '날짜미상'})`)
    .join('\n') ?? ''

  // 사용자 질문 키워드로 관련 공지 본문 검색 (RAG)
  const lastUserMsg = [...messages].reverse().find((m: {role: string}) => m.role === 'user')?.content ?? ''
  const keywords = lastUserMsg
    .replace(/[?？!！.。,，]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length >= 2)
    .slice(0, 6)

  let ragContext = ''
  if (keywords.length > 0) {
    const orFilter = keywords.map((k: string) => `title.ilike.%${k}%`).join(',')
    const { data: matched } = await supabase
      .from('notices')
      .select('title, organization_id, published_at, content')
      .or(orFilter)
      .not('content', 'is', null)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(4)

    if (matched && matched.length > 0) {
      ragContext = matched
        .map((n) =>
          `[${n.organization_id.toUpperCase()}] ${n.title} (${n.published_at?.slice(0, 10) ?? '날짜미상'})\n${n.content?.slice(0, 600) ?? ''}`
        )
        .join('\n\n---\n\n')
    }
  }

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
1. 알고 있는 내용은 구체적인 수치와 코드까지 포함해 실무에 바로 활용 가능하게 답변
2. 관련 고시·훈령 번호, 법령 조항을 명시
3. 2025~2026년 수가 변경사항은 학습 데이터 기준으로 답변하고, 반드시 최신 고시 확인을 권고
4. 불확실한 내용은 "확인 필요"로 명시하되, 아는 범위에서 최대한 구체적으로 답변
5. 복잡한 사례는 단계별 설명
6. 한국어로만 답변

## 최근 수집된 공지사항 (제목)
${recentList || '(없음)'}

${ragContext ? `## 질문 관련 공지 본문 (DB 검색 결과)\n${ragContext}` : ''}
${context ? `## 현재 보고 있는 공지\n${context}` : ''}`

  try {
    const res = await chat(
      [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      { stream: true, max_tokens: 3000, model: 'anthropic/claude-haiku-4.5' }
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
