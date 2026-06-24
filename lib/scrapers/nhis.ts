import * as cheerio from 'cheerio'
import { CrawledNotice } from '@/types'

const BASE = 'https://www.nhis.or.kr'

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export async function scrapeNHIS(): Promise<CrawledNotice[]> {
  const endpoints = [
    { url: `${BASE}/nhis/together/wbhaea01000m01.do`, category: '공지사항' },
    { url: `${BASE}/nhis/together/wbhaec07200m01.do`, category: '보도자료' },
  ]

  const all: CrawledNotice[] = []

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) continue
      const html = await res.text()
      const $ = cheerio.load(html)

      $('table tbody tr, .board_list tbody tr').each((_, el) => {
        const $el = $(el)
        const $a = $el.find('a').first()
        const title = $a.text().trim()
        const href = $a.attr('href') ?? ''
        if (!title || title.length < 2) return
        if (!href || href === '#' || href.startsWith('javascript:')) return

        // href가 ?로 시작하면 endpoint 경로에 붙여야 정확한 URL이 됨
        const fullUrl = href.startsWith('http')
          ? href
          : href.startsWith('?')
          ? `${ep.url}${href}`
          : `${BASE}${href.startsWith('/') ? '' : '/'}${href}`
        if (!isValidUrl(fullUrl)) return

        const dateText = findDateText($el.find('td').toArray().map(td => $(td).text().trim()))
        const isImportant = $el.hasClass('notice') || $el.find('.mark_notice, .ico_notice').length > 0

        all.push({
          organization_id: 'nhis',
          title,
          url: fullUrl,
          category: ep.category,
          published_at: parseDateStr(dateText) ?? undefined,
          is_important: isImportant,
        })
      })
    } catch {
      continue
    }
  }

  return all.slice(0, 30)
}

function findDateText(texts: string[]): string {
  for (const t of texts) {
    if (/\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/.test(t) && t.length < 30) return t
  }
  return ''
}

function parseDateStr(str: string): string | null {
  const m = str.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (!m) return null
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T00:00:00Z`
}
