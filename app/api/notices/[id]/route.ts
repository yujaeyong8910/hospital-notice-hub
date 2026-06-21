import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('notices')
    .select(`*, organizations(*), notice_summaries(*), bookmarks(*)`)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // increment view count
  await supabase.from('notices').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', id)

  return NextResponse.json(data)
}
