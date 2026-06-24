'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  context?: string
  placeholder?: string
}

export interface ChatPanelHandle {
  sendQuestion: (text: string) => void
}

export const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(
function ChatPanel({ context, placeholder = '건강보험 청구, 심사기준 등 업무 관련 질문을 입력하세요...' }: ChatPanelProps, ref) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 병원 원무팀·심사팀 AI 어시스턴트입니다.\n건강보험 청구, 요양급여기준, 심사평가 등 업무 관련 질문에 답변드립니다.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    sendQuestion(text: string) {
      setInput(text)
      textareaRef.current?.focus()
    },
  }))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages((prev) => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'AI 서버 오류' }))
        throw new Error(err.error ?? 'AI 서버 오류')
      }
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let done = false

      while (!done) {
        const { done: streamDone, value } = await reader.read()
        done = streamDone
        if (!value) continue
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') { done = true; break }
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content ?? ''
            if (!delta) continue
            full += delta
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: full }
              return updated
            })
          } catch {}
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: `오류: ${msg}\n잠시 후 다시 시도해 주세요.` }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-800'
              )}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              )}
            >
              {msg.content || (loading && i === messages.length - 1 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Enter로 전송, Shift+Enter로 줄바꿈</p>
      </div>
    </div>
  )
})

ChatPanel.displayName = 'ChatPanel'
