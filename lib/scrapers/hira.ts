import * as cheerio from 'cheerio'
import { CrawledNotice } from '@/types'

const BASE = 'https://www.hira.or.kr'

export async function scrapeHIRA(): Promise<CrawledNotice[]> {
  const endpoints = [
    { url: `${BASE}/bbsDummy.do?pgmid=HIRAA030001000100&brdBltNo=`, category: '공지사항' },
    { url: `${BASE}/bbsDummy.do?pgmid=HIRAA030001000200`, category: '보도자료' },
    { url: `${BASE}/main/judgment/getJobList.do`, category: '심사기준' },
  ]

  const all: CrawledNotice[] = []

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: BASE,
        },
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) continue
      const html = await res.text()
      const $ = cheerio.load(html)

      $('table tbody tr, .bbs-list tbody tr, ul.list li').each((_, el) => {
        const $el = $(el)
        const $a = $el.find('a').first()
        const title = $a.text().trim()
        const href = $a.attr('href') ?? ''
        if (!title || title.length < 3) return

        const fullUrl = href.startsWith('http')
          ? href
          : href.startsWith('/')
          ? `${BASE}${href}`
          : ep.url

        const dateText = $el.find('.date, td:nth-child(4), td:last-child').first().text().trim()
        const isImportant = $el.hasClass('notice') || $el.find('.mark-notice').length > 0

        all.push({
          organization_id: 'hira',
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
