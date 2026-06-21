import * as cheerio from 'cheerio'
import { CrawledNotice } from '@/types'

const BASE = 'https://www.mohw.go.kr'

export async function scrapeMOHW(): Promise<CrawledNotice[]> {
  // 보건복지부 공지사항 & 보도자료
  const endpoints = [
    { url: `${BASE}/react/al/salalm0301ls.do?menuId=MENU_NEW_01_02`, category: '공지사항' },
    { url: `${BASE}/react/al/salalm0101ls.do?menuId=MENU_NEW_04_01`, category: '보도자료' },
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

      $('table tbody tr').each((_, el) => {
        const $el = $(el)
        const $a = $el.find('a').first()
        const title = $a.text().trim()
        const href = $a.attr('href') ?? ''
        if (!title || title === '제목') return

        const fullUrl = href.startsWith('http') ? href : `${BASE}${href}`
        const dateText = $el.find('td').last().text().trim()
        const isImportant = $el.find('.notice, .important').length > 0

        all.push({
          organization_id: 'mohw',
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

function parseDateStr(str: string): string | null {
  const m = str.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (!m) return null
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T00:00:00Z`
}
