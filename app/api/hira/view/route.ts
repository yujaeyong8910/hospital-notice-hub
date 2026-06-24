import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://biz.hira.or.kr'
const DETAIL_URL = `${BASE}/qya/bbs/selectComBbsDetail.ndo`
const RS = '\x1e'
const US = '\x1f'

function buildDetailSsv(nttId: string, bbsId: string): string {
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
      '_RowType_', 'atchFileId:STRING(256)', 'nttId:STRING(256)', 'bbsId:STRING(256)',
      'totCnt:STRING(256)', 'currentPage:STRING(256)', 'recordCountPerPage:STRING(256)',
      'firstIndex:STRING(256)', 'lastIndex:STRING(256)', 'codeId:STRING(256)',
      'commentNo:STRING(256)', 'commentCn:STRING(256)',
    ].join(US),
    ['N', '', nttId, bbsId, '', '', '', '', '', '', '', ''].join(US),
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

function parseSsvDetail(text: string): Record<string, string> | null {
  const sections = text.split(RS)
  let inDataset = false
  let fields: string[] = []

  for (const section of sections) {
    if (section.startsWith('Dataset:dsDetail') || section.startsWith('Dataset:dsMain')) {
      inDataset = true
      continue
    }
    if (inDataset && section.startsWith('Dataset:')) break
    if (inDataset && section.startsWith('_RowType_')) {
      fields = section.split(US).map(f => f.split(':')[0])
      continue
    }
    if (inDataset && fields.length > 0 && (section.startsWith('N') || section.startsWith('U'))) {
      const vals = section.split(US)
      const row: Record<string, string> = {}
      fields.forEach((name, i) => { row[name] = vals[i] ?? '' })
      return row
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const originalUrl = searchParams.get('url') ?? ''

  // Extract nttId and bbsId from the original popup.ndo URL
  const nttIdMatch = originalUrl.match(/[?&]nttId=([^&]+)/)
  const bbsIdMatch = originalUrl.match(/[?&]bbsId=([^&]+)/)
  const nttId = nttIdMatch?.[1] ?? searchParams.get('nttId') ?? ''
  const bbsId = bbsIdMatch?.[1] ?? searchParams.get('bbsId') ?? 'BBSMSTR_000000000675'

  if (!nttId) {
    return new NextResponse('nttId 파라미터가 필요합니다', { status: 400 })
  }

  try {
    const body = buildDetailSsv(nttId, bbsId)
    const res = await fetch(DETAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        Accept: 'application/xml, text/xml, */*',
        Referer: `${BASE}/popup.ndo?formname=qya_bizcom%3A%3AInfoBank.xfdl&framename=InfoBank`,
        Origin: BASE,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache, no-store',
      },
      body,
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return renderFallback(nttId, '공지를 불러올 수 없습니다 (서버 오류)')
    }

    const text = await res.text()
    if (!text.startsWith('SSV:')) {
      return renderFallback(nttId, '공지를 불러올 수 없습니다 (형식 오류)')
    }

    const row = parseSsvDetail(text)
    if (!row) {
      return renderFallback(nttId, '공지 내용을 파싱할 수 없습니다')
    }

    const title = row['nttSj'] ?? ''
    const dateRaw = row['frstregisterPntt'] ?? ''
    const dateStr = dateRaw.match(/^(\d{4})(\d{2})(\d{2})/)
      ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
      : ''
    let content = row['nttCn'] ?? ''

    // Remove charset meta to avoid browser encoding conflict (content is UTF-8 from SSV)
    content = content.replace(/<meta[^>]+charset[^>]*>/gi, '')

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif; max-width: 860px; margin: 0 auto; padding: 24px; color: #1f2937; }
    .header { border-bottom: 2px solid #7C3AED; padding-bottom: 16px; margin-bottom: 24px; }
    .badge { display: inline-block; background: #7C3AED; color: white; font-size: 12px; padding: 2px 10px; border-radius: 99px; margin-bottom: 10px; }
    h1 { font-size: 20px; font-weight: 700; margin: 8px 0; line-height: 1.4; }
    .meta { font-size: 13px; color: #6b7280; margin-top: 6px; }
    .content { line-height: 1.8; font-size: 14px; }
    .content table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    .content td, .content th { border: 1px solid #d1d5db; padding: 6px 10px; }
    .back { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #6b7280; text-decoration: none; margin-bottom: 20px; }
    .back:hover { color: #374151; }
  </style>
</head>
<body>
  <a class="back" href="javascript:history.back()">← 돌아가기</a>
  <div class="header">
    <span class="badge">건강보험심사평가원</span>
    <h1>${escapeHtml(title)}</h1>
    ${dateStr ? `<p class="meta">게시일: ${dateStr}</p>` : ''}
  </div>
  <div class="content">${content || '<p style="color:#9ca3af">내용을 불러올 수 없습니다.</p>'}</div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch {
    return renderFallback(nttId, '공지를 불러오는 중 오류가 발생했습니다')
  }
}

function renderFallback(nttId: string, message: string) {
  const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><title>공지 열기 오류</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;}
.box{text-align:center;padding:40px;}.title{font-size:18px;font-weight:700;color:#111827;margin-bottom:8px;}
.msg{color:#6b7280;font-size:14px;margin-bottom:20px;}
a{display:inline-block;background:#7C3AED;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;}</style></head>
<body><div class="box"><p class="title">원문 열기 실패</p><p class="msg">${escapeHtml(message)}</p>
<a href="https://biz.hira.or.kr/index.do" target="_blank">심사평가원 사이트로 이동</a></div></body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
