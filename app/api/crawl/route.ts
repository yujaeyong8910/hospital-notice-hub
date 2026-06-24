import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase-server'
import { scrapeAll } from '@/lib/scrapers'
import { fetchArticleContent } from '@/lib/scrapers/fetchContent'

export const maxDuration = 60

async function runCrawl() {
  const supabase = createServerClient()
  const notices = await scrapeAll()

  // 이미 DB에 있는 URL 조회 (내용이 있는 것 포함)
  const { data: existing } = await supabase
    .from('notices')
    .select('url, content')
    .in('url', notices.map((n) => n.url))

  const existingMap = new Map(
    (existing ?? []).map((n) => [n.url, n.content])
  )

  // 새 공지 (DB에 없는 것)만 본문 수집 — 최대 12개 병렬
  const newNotices = notices.filter((n) => !existingMap.has(n.url) && !n.content)
  const toFetch = newNotices.slice(0, 12)

  if (toFetch.length > 0) {
    const contentResults = await Promise.allSettled(
      toFetch.map((n) => fetchArticleContent(n.url).then((c) => ({ url: n.url, content: c })))
    )
    const contentMap = new Map(
      contentResults
        .filter((r): r is PromiseFulfilledResult<{ url: string; content: string }> => r.status === 'fulfilled')
        .map((r) => [r.value.url, r.value.content])
    )
    for (const notice of notices) {
      if (!notice.content && contentMap.get(notice.url)) {
        notice.content = contentMap.get(notice.url)
      }
    }
  }

  let inserted = 0
  let failed = 0

  for (const notice of notices) {
    const { error } = await supabase.from('notices').upsert(
      {
        organization_id: notice.organization_id,
        title: notice.title,
        url: notice.url,
        content: notice.content ?? null,
        category: notice.category ?? null,
        published_at: notice.published_at ?? null,
        is_important: notice.is_important ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'url', ignoreDuplicates: false }
    )
    if (error) failed++
    else inserted++
  }

  revalidatePath('/')
  revalidatePath('/notices')

  return {
    message: `크롤링 완료: ${inserted}개 저장, ${failed}개 실패 (본문 수집 ${toFetch.length}건)`,
    total: notices.length,
    inserted,
    failed,
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(await runCrawl())
}

// Vercel Cron 및 수동 실행용
export async function GET() {
  return NextResponse.json(await runCrawl())
}
