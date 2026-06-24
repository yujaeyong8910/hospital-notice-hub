import { CrawledNotice } from '@/types'

const BASE = 'https://biz.hira.or.kr'
const LIST_URL = `${BASE}/qya/bbs/selectComBbsList.ndo`
const RS = '\x1e'
const US = '\x1f'
const NUL = '\x03'

const BOARDS = [
  { bbsId: 'BBSMSTR_000000000675', category: '공지사항' },
]

function buildSsvBody(bbsId: string): string {
  const rows = [
    'SSV:utf-8',
    'JSESSIONID=null',
    'BIZINTERSESSION=',
    'WMONID=NoticeHub01',
    'browserType=Chrome',
    'osVersion=Windows 10',
    'navigatorName=Chrome',
    'navigatorVersion=109',
    'Dataset:dsParam',
    [
      '_RowType_', 'brdTyBltNo:STRING(256)', 'bltNo:STRING(256)', 'totCnt:STRING(256)',
      'currentPage:STRING(256)', 'recordCountPerPage:STRING(256)', 'firstIndex:STRING(256)',
      'lastIndex:STRING(256)', 'bbsId:STRING(256)', 'cbSearchCnd:STRING(256)',
      'edSearchWrd:STRING(256)', 'nttId:STRING(256)', 'atchFileId:STRING(256)',
      'codeId:STRING(256)', 'catType01Val:STRING(256)', 'catType02Val:STRING(256)',
      'catType03Val:STRING(256)',
    ].join(US),
    ['N', '', '', '', '1', '20', '0', '20', bbsId, 'all', NUL, '', '', '', '', '', ''].join(US),
    '',
    'Dataset:gdsCurrentMenu',
    [
      '_RowType_', 'menuId:STRING(256)', 'menuNm:STRING(256)', 'urlDtlAddr:STRING(256)',
      'sysCd:STRING(256)', 'scnId:STRING(256)', 'locToDown:STRING(256)', 'hiSysCd:STRING(256)',
      'bPopupYn:STRING(256)', 'seAdtYn:STRING(256)', 'formId:STRING(256)',
      'winId:STRING(256)', 'params:STRING(256)',
    ].join(US),
    '',
    '',
  ]
  return rows.join(RS)
}

function parseSsvResponse(text: string): Array<Record<string, string>> {
  const sections = text.split(RS)
  const results: Array<Record<string, string>> = []
  let inMain = false
  let fields: string[] = []

  for (const section of sections) {
    if (section.startsWith('Dataset:dsMain')) {
      inMain = true
      continue
    }
    if (inMain && section.startsWith('Dataset:')) {
      break
    }
    if (inMain && section.startsWith('_RowType_')) {
      fields = section.split(US).map(f => f.split(':')[0])
      continue
    }
    if (inMain && fields.length > 0 && (section.startsWith('N') || section.startsWith('U'))) {
      const vals = section.split(US)
      const row: Record<string, string> = {}
      fields.forEach((name, i) => { row[name] = vals[i] ?? '' })
      results.push(row)
    }
  }
  return results
}

function parseBizDate(str: string): string | null {
  const m = str.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]}T00:00:00Z`
}

export async function scrapeHIRA(): Promise<CrawledNotice[]> {
  const all: CrawledNotice[] = []

  for (const board of BOARDS) {
    try {
      const body = buildSsvBody(board.bbsId)
      const res = await fetch(LIST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          Accept: 'application/xml, text/xml, */*',
          Referer: `${BASE}/popup.ndo?formname=qya_bizcom%3A%3AInfoBank.xfdl&framename=InfoBank`,
          Origin: BASE,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
        body,
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) continue

      const text = await res.text()
      if (!text.startsWith('SSV:')) continue

      const rows = parseSsvResponse(text)
      for (const row of rows) {
        const title = row['nttSj'] ?? ''
        const nttId = row['nttId'] ?? ''
        if (!title || title.length < 2 || !nttId) continue

        all.push({
          organization_id: 'hira',
          title,
          url: `${BASE}/popup.ndo?formname=qya_bizcom%3A%3AInfoBank.xfdl&framename=InfoBank&nttId=${nttId}&bbsId=${board.bbsId}`,
          category: board.category,
          published_at: parseBizDate(row['frstregisterPntt'] ?? '') ?? undefined,
          is_important: row['isNotice'] === 'Y',
        })
      }
    } catch {
      continue
    }
  }

  return all.slice(0, 30)
}
