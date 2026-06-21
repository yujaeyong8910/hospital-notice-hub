import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { summarizeNotice } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  const { notice_id, title, content } = await req.json()
  if (!notice_id || !title) {
    return NextResponse.json({ error: 'notice_id and title required' }, { status: 400 })
  }

  const supabase = createServerClient()

  // check if summary already exists
  const { data: existing } = await supabase
    .from('notice_summaries')
    .select('*')
    .eq('notice_id', notice_id)
    .single()

  if (existing) return NextResponse.json(existing)

  const result = await summarizeNotice(title, content ?? title)

  const { data, error } = await supabase
    .from('notice_summaries')
    .insert({
      notice_id,
      summary: result.summary,
      key_points: result.key_points ?? [],
      impact_level: result.impact_level ?? 'medium',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
