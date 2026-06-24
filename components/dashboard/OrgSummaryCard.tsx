'use client'

import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Notice } from '@/types'
import { ORG_META, timeAgo, formatDate } from '@/lib/utils'

interface OrgSummaryCardProps {
  orgId: string
  notices: Notice[]
}

export function OrgSummaryCard({ orgId, notices }: OrgSummaryCardProps) {
  const meta = ORG_META[orgId]
  if (!meta) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100" style={{ borderLeftColor: meta.color, borderLeftWidth: 4 }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">{meta.label}</h3>
          <Link
            href={`/notices?org=${orgId}`}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            전체보기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">공지 {notices.length}건</p>
      </div>

      {/* Notice list */}
      <ul className="divide-y divide-gray-50">
        {notices.length === 0 && (
          <li className="px-5 py-4 text-sm text-gray-400 text-center">공지사항이 없습니다</li>
        )}
        {notices.slice(0, 5).map((notice) => (
          <li key={notice.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
            <Link href={`/notices/${notice.id}`} className="block">
              <p className="text-sm text-gray-800 font-medium line-clamp-1 hover:text-blue-600 transition-colors">
                {notice.is_important && <span className="text-amber-500 mr-1">★</span>}
                {notice.title}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">
                  {notice.published_at ? timeAgo(notice.published_at) : formatDate(notice.created_at)}
                </span>
                <a
                  href={notice.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
