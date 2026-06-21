import * as cheerio from 'cheerio'
import { CrawledNotice } from '@/types'

const BASE = 'https://www.kha.or.kr'

export async function scrapeKHA(): Promise<CrawledNotice[]> {
  const urls = [
    `${BASE}/notice/notice`,
    `${BASE}/inform/notice`,
    `${BASE}/board/notice`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NoticeBot/1.0)' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const html = await res.text()
      const $ = cheerio.load(html)
      const notices: CrawledNotice[] = []

      $('table tbody tr, .board-list li, .notice-list li').each((_, el) => {
        const $el = $(el)
        const $a = $el.find('a').first()
        const title = $a.text().trim()
        const href = $a.attr('href') ?? ''
        if (!title || !href) return

        const fullUrl = href.startsWith('http') ? href : `${BASE}${href}`
        const dateText = $el.find('.date, td:last-child').text().trim()

        notices.push({
          organization_id: 'kha',
          title,
          url: fullUrl,
          published_at: parseKoreanDate(dateText) ?? undefined,
        })
      })

      if (notices.length > 0) return notices.slice(0, 20)
    } catch {
      continue
    }
  }
  return []
}

function parseKoreanDate(str: string): string | null {
  const m = str.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (!m) return null
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T00:00:00Z`
}
