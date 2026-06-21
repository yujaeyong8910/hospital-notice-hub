'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { OrgBadge } from '@/components/notices/OrgBadge'
import { Notice, NoticeSummary } from '@/types'
import { formatDate, ORG_META } from '@/lib/utils'
import {
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Loader2,
  Star,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react'

const impactConfig = {
  high:   { icon: AlertCircle, color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   label: '높음 - 즉시 업무 변경 필요' },
  medium: { icon: Info,         color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: '보통 - 참고 필요' },
  low:    { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: '낮음 - 일반 정보' },
}

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [summary, setSummary] = useState<NoticeSummary | null>(null)
  const [loadingNotice, setLoadingNotice] = useState(true)
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/notices/${id}`)
      if (!res.ok) { router.push('/notices'); return }
      const data: Notice = await res.json()
      setNotice(data)
      setLoadingNotice(false)
      if (data.notice_summaries?.[0]) {
        setSummary(data.notice_summaries[0])
      }
    }
    load()
  }, [id, router])

  async function generateSummary() {
    if (!notice || loadingSummary) return
    setLoadingSummary(true)
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice_id: notice.id, title: notice.title, content: notice.content }),
      })
      const data = await res.json()
      setSummary(data)
    } finally {
      setLoadingSummary(false)
    }
  }

  if (loadingNotice) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }
  if (!notice) return null

  const meta = ORG_META[notice.organization_id]
  const impact = summary ? impactConfig[summary.impact_level] : null

  return (
    <>
      <Header title="공지 상세" subtitle={notice.organizations?.name} />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 목록으로
          </button>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Left: Notice content */}
            <div className="xl:col-span-3 space-y-5">
              {/* Notice header card */}
              <div
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                style={{ borderTopColor: meta?.color, borderTopWidth: 4 }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <OrgBadge orgId={notice.organization_id} size="md" />
                      {notice.category && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {notice.category}
                        </span>
                      )}
                      {notice.is_important && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 중요
                        </span>
                      )}
                    </div>
                    <a
                      href={notice.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors shrink-0"
                    >
                      원문 보기 <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <h1 className="text-xl font-bold text-gray-900 leading-snug mb-4">{notice.title}</h1>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>게시일: {formatDate(notice.published_at ?? notice.created_at)}</span>
                    <span>조회수: {notice.view_count}</span>
                  </div>
                </div>

                {notice.content && (
                  <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{notice.content}</p>
                  </div>
                )}
              </div>

              {/* AI Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    <h2 className="font-bold text-gray-900">AI 요약 분석</h2>
                  </div>
                  {!summary && (
                    <button
                      onClick={generateSummary}
                      disabled={loadingSummary}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
                    >
                      {loadingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {loadingSummary ? '분석 중...' : 'AI 요약 생성'}
                    </button>
                  )}
                </div>

                {summary ? (
                  <div className="space-y-4">
                    {impact && (
                      <div className={`flex items-start gap-3 p-3 rounded-lg border ${impact.bg} ${impact.border}`}>
                        <impact.icon className={`w-4 h-4 mt-0.5 shrink-0 ${impact.color}`} />
                        <div>
                          <p className={`text-xs font-semibold ${impact.color}`}>영향도: {impact.label}</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">핵심 요약</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{summary.summary}</p>
                    </div>
                    {summary.key_points?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">주요 포인트</p>
                        <ul className="space-y-2">
                          {summary.key_points.map((pt, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">
                    AI 요약을 생성하면 핵심 내용과 업무 영향도를 확인할 수 있습니다
                  </p>
                )}
              </div>
            </div>

            {/* Right: AI Chat */}
            <div className="xl:col-span-2 h-[600px] xl:h-auto xl:min-h-[700px]">
              <ChatPanel
                context={`공지제목: ${notice.title}${summary ? `\n요약: ${summary.summary}` : ''}`}
                placeholder="이 공지에 대해 질문하세요..."
              />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
