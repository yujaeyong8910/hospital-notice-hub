import Link from 'next/link'
import { ExternalLink, Star, Eye } from 'lucide-react'
import { Notice } from '@/types'
import { formatDate, timeAgo, ORG_META } from '@/lib/utils'
import { OrgBadge } from './OrgBadge'

interface NoticeCardProps {
  notice: Notice
  compact?: boolean
}

export function NoticeCard({ notice, compact = false }: NoticeCardProps) {
  const meta = ORG_META[notice.organization_id]
  const summary = notice.notice_summaries?.[0]

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden group"
      style={{ borderLeftColor: meta?.color, borderLeftWidth: 4 }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <OrgBadge orgId={notice.organization_id} />
            {notice.category && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {notice.category}
              </span>
            )}
            {notice.is_important && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                중요
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 shrink-0 mt-0.5">
            {notice.published_at ? timeAgo(notice.published_at) : formatDate(notice.created_at)}
          </span>
        </div>

        <Link href={`/notices/${notice.id}`} className="block group-hover:text-blue-600 transition-colors">
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 mb-2 text-sm">
            {notice.title}
          </h3>
        </Link>

        {!compact && summary && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {summary.summary}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {notice.published_at ? formatDate(notice.published_at) : `수집: ${formatDate(notice.created_at)}`}
          </span>
          <div className="flex items-center gap-2">
            {notice.view_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Eye className="w-3 h-3" />
                {notice.view_count}
              </span>
            )}
            <a
              href={
                notice.organization_id === 'hira'
                  ? `/api/hira/view?url=${encodeURIComponent(notice.url)}`
                  : notice.url
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              원문 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {summary && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                summary.impact_level === 'high'
                  ? 'bg-red-500'
                  : summary.impact_level === 'medium'
                  ? 'bg-amber-400'
                  : 'bg-green-400'
              }`}
            />
            <span className="text-xs text-gray-500">
              영향도:{' '}
              <span className="font-medium text-gray-700">
                {summary.impact_level === 'high' ? '높음' : summary.impact_level === 'medium' ? '보통' : '낮음'}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
