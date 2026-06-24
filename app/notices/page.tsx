'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { NoticeCard } from '@/components/notices/NoticeCard'
import { Notice } from '@/types'
import { ORG_META } from '@/lib/utils'
import { Loader2, Filter, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const ORGS = ['kha', 'mohw', 'nhis', 'hira'] as const
const LIMIT = 20

function NoticesContent() {
  const searchParams = useSearchParams()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)
  const [orgFilter, setOrgFilter] = useState(searchParams.get('org') ?? '')
  const [importantOnly, setImportantOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '')

  const fetchNotices = useCallback(async (reset = false) => {
    setLoading(true)
    const currentOffset = reset ? 0 : offsetRef.current
    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(currentOffset),
    })
    if (orgFilter) params.set('org', orgFilter)
    if (importantOnly) params.set('important', 'true')
    if (searchQuery) params.set('search', searchQuery)

    const res = await fetch(`/api/notices?${params}`)
    const data = await res.json()
    const fetched: Notice[] = data.notices ?? []

    if (reset) {
      setNotices(fetched)
      offsetRef.current = LIMIT
    } else {
      setNotices((prev) => [...prev, ...fetched])
      offsetRef.current += LIMIT
    }
    setHasMore(fetched.length === LIMIT)
    setLoading(false)
  }, [orgFilter, importantOnly, searchQuery])

  useEffect(() => {
    fetchNotices(true)
  }, [fetchNotices])

  return (
    <>
      <Header
        title="공지사항"
        subtitle={`${notices.length}개의 공지사항`}
      />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {/* Filter bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500 font-medium">필터:</span>
            </div>

            <button
              onClick={() => setOrgFilter('')}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                orgFilter === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              전체
            </button>

            {ORGS.map((id) => {
              const meta = ORG_META[id]
              return (
                <button
                  key={id}
                  onClick={() => setOrgFilter(id === orgFilter ? '' : id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    orgFilter === id ? meta.badge + ' ring-2 ring-offset-1' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                  style={orgFilter === id ? { outline: `2px solid ${meta.color}` } : {}}
                >
                  {meta.label}
                </button>
              )
            })}

            <button
              onClick={() => setImportantOnly(!importantOnly)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ml-auto',
                importantOnly ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Star className={cn('w-3 h-3', importantOnly ? 'fill-amber-500 text-amber-500' : '')} />
              중요만 보기
            </button>
          </div>

          {searchQuery && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-500">검색: <strong>{searchQuery}</strong></span>
              <button onClick={() => setSearchQuery('')} className="text-xs text-red-500 hover:underline">지우기</button>
            </div>
          )}
        </div>

        {/* Notice grid */}
        <div className="p-6">
          {notices.length === 0 && !loading && (
            <div className="text-center py-16">
              <p className="text-gray-400">해당하는 공지사항이 없습니다</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {notices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          )}

          {!loading && hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchNotices(false)}
                className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                더 보기
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default function NoticesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>}>
      <NoticesContent />
    </Suspense>
  )
}
