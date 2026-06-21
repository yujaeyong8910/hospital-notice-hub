const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export async function chat(messages: Message[], options: ChatOptions = {}) {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000',
      'X-Title': '병원 업무 공지 허브',
    },
    body: JSON.stringify({
      model: options.model ?? 'openai/gpt-4o-mini',
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 1500,
      stream: options.stream ?? false,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error: ${err}`)
  }

  return res
}

export async function chatJSON(messages: Message[], options: ChatOptions = {}) {
  const res = await chat(messages, options)
  const data = await res.json()
  return data.choices[0]?.message?.content ?? ''
}

export async function summarizeNotice(title: string, content: string) {
  const text = await chatJSON([
    {
      role: 'system',
      content: `당신은 병원 원무팀·심사팀을 위한 의료행정 전문 AI입니다.
공지사항을 분석하여 실무자가 즉시 활용할 수 있도록 요약해 주세요.
반드시 아래 JSON 형식으로만 응답하세요:
{
  "summary": "3~5문장으로 핵심 내용 요약",
  "key_points": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
  "impact_level": "high 또는 medium 또는 low"
}
impact_level 기준: high=즉시 업무 변경 필요, medium=참고 필요, low=일반 정보`,
    },
    {
      role: 'user',
      content: `제목: ${title}\n\n내용:\n${content.slice(0, 3000)}`,
    },
  ])

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return {
      summary: text,
      key_points: [],
      impact_level: 'medium',
    }
  }
}
