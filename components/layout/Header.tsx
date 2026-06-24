'use client'

import { RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const [crawling, setCrawling] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  async function handleCrawl() {
    setCrawling(true)
    try {
      await fetch('/api/crawl')
      router.refresh()
    } finally {
      setCrawling(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/notices?search=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="공지사항 검색..."
              className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </form>
          <button
            onClick={handleCrawl}
            disabled={crawling}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${crawling ? 'animate-spin' : ''}`} />
            {crawling ? '수집 중...' : '새로고침'}
          </button>
        </div>
      </div>
    </header>
  )
}
