import * as cheerio from 'cheerio'
import { CrawledNotice } from '@/types'

const BASE = 'https://www.kha.or.kr'

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export async function scrapeKHA(): Promise<CrawledNotice[]> {
  const urls = [
    `${BASE}/board/notice/list`,
    `${BASE}/notice/notice`,
    `${BASE}/inform/notice`,
    `${BASE}/board/notice`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) continue
      const html = await res.text()
      const $ = cheerio.load(html)
      const notices: CrawledNotice[] = []

      $('table tbody tr, .board-list li, .notice-list li, .bbs_list tbody tr').each((_, el) => {
        const $el = $(el)
        const $a = $el.find('a').first()
        const title = $a.text().trim()
        const href = $a.attr('href') ?? ''
        if (!title || title.length < 2) return
        if (!href || href === '#' || href.startsWith('javascript:')) return

        const fullUrl = href.startsWith('http') ? href : `${BASE}${href.startsWith('/') ? '' : '/'}${href}`
        if (!isValidUrl(fullUrl)) return

        const dateText = $el.find('.date, td:last-child, .td_date').text().trim()
        const isImportant = $el.hasClass('notice') || $el.hasClass('important') || $el.find('.icon_notice').length > 0

        notices.push({
          organization_id: 'kha',
          title,
          url: fullUrl,
          published_at: parseDateStr(dateText) ?? undefined,
          is_important: isImportant,
        })
      })

      if (notices.length > 0) return notices.slice(0, 20)
    } catch {
      continue
    }
  }
  return []
}

function parseDateStr(str: string): string | null {
  const m = str.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (!m) return null
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T00:00:00Z`
}
