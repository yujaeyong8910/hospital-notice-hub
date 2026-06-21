import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org = searchParams.get('org')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const important = searchParams.get('important')

  const supabase = createServerClient()

  let query = supabase
    .from('notices')
    .select(`*, organizations(*), notice_summaries(*)`)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (org) query = query.eq('organization_id', org)
  if (important === 'true') query = query.eq('is_important', true)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ notices: data, count })
}
