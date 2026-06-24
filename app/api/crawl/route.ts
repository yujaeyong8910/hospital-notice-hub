import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { scrapeAll } from '@/lib/scrapers'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const notices = await scrapeAll()

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

  return NextResponse.json({
    message: `크롤링 완료: ${inserted}개 저장, ${failed}개 실패`,
    total: notices.length,
    inserted,
    failed,
  })
}

// Vercel Cron 및 수동 실행용 (인증 불필요)
export async function GET() {
  const supabase = createServerClient()
  const notices = await scrapeAll()

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

  return NextResponse.json({
    message: `크롤링 완료: ${inserted}개 저장, ${failed}개 실패`,
    total: notices.length,
    inserted,
    failed,
  })
}
