import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [total, todayCount, importantCount, byOrg] = await Promise.all([
    supabase.from('notices').select('*', { count: 'exact', head: true }),
    supabase.from('notices').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('notices').select('*', { count: 'exact', head: true }).eq('is_important', true),
    supabase.from('notices').select('organization_id'),
  ])

  const orgCounts: Record<string, number> = {}
  for (const row of byOrg.data ?? []) {
    orgCounts[row.organization_id] = (orgCounts[row.organization_id] ?? 0) + 1
  }

  return NextResponse.json({
    total: total.count ?? 0,
    today: todayCount.count ?? 0,
    important: importantCount.count ?? 0,
    byOrg: orgCounts,
  })
}
