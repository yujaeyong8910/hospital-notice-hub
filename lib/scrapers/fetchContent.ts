import * as cheerio from 'cheerio'

const CONTENT_SELECTORS = [
  '.view_content', '.board_view', '.cont_area', '.view_cont',
  '.notice_view', '.bbs_view', '.article_view', '.content_area',
  '#contents .inner', '#content .inner', '.view_detail',
  '.detail_content', '.bbs_content', '#bbsContent',
  'article', '.article',
]

export async function fetchArticleContent(url: string): Promise<string> {
  if (url.includes('popup.ndo') || url.includes('nexacro')) return ''
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return ''
    const html = await res.text()
    const $ = cheerio.load(html)

    $('script, style, nav, header, footer, .nav, .menu, .sidebar, .gnb, .lnb, .snb, .breadcrumb, .pagination, .btn_area').remove()

    for (const sel of CONTENT_SELECTORS) {
      const text = $(sel).text().replace(/\s+/g, ' ').trim()
      if (text.length > 80) return text.slice(0, 1000)
    }

    // fallback: body에서 메뉴/네비 제거 후 텍스트
    $('header, footer, nav, .header, .footer, .top_area, .left_area, .right_area').remove()
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
    return bodyText.slice(0, 1000)
  } catch {
    return ''
  }
}
