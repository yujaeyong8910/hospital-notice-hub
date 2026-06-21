import { createServerClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { OrgSummaryCard } from '@/components/dashboard/OrgSummaryCard'
import { Bell, TrendingUp, AlertTriangle, Database } from 'lucide-react'
import { Notice } from '@/types'

export const revalidate = 300

async function getDashboardData() {
  const supabase = createServerClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [{ data: notices }, { count: total }, { count: todayCount }, { count: importantCount }] =
    await Promise.all([
      supabase
        .from('notices')
        .select('*, organizations(*), notice_summaries(*)')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(40),
      supabase.from('notices').select('*', { count: 'exact', head: true }),
      supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
      supabase.from('notices').select('*', { count: 'exact', head: true }).eq('is_important', true),
    ])

  const byOrg: Record<string, Notice[]> = { kha: [], mohw: [], nhis: [], hira: [] }
  for (const n of notices ?? []) {
    if (byOrg[n.organization_id]) byOrg[n.organization_id].push(n as Notice)
  }

  return { byOrg, total: total ?? 0, todayCount: todayCount ?? 0, importantCount: importantCount ?? 0 }
}

export default async function DashboardPage() {
  const { byOrg, total, todayCount, importantCount } = await getDashboardData()

  const lastUpdated = new Date().toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      <Header title="대시보드" subtitle={`마지막 업데이트: ${lastUpdated}`} />
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="전체 공지" value={total} subtitle="수집된 공지사항" icon={Database} color="blue" />
          <StatsCard title="오늘 업데이트" value={todayCount} subtitle="신규 공지사항" icon={TrendingUp} color="green" />
          <StatsCard title="중요 공지" value={importantCount} subtitle="주의 필요" icon={AlertTriangle} color="amber" />
          <StatsCard title="연동 기관" value={4} subtitle="KHA·MOHW·NHIS·HIRA" icon={Bell} color="violet" />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">기관별 최신 공지</h2>
          <a href="/notices" className="text-sm text-blue-600 hover:underline">전체 보기 →</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <OrgSummaryCard orgId="kha" notices={byOrg.kha} />
          <OrgSummaryCard orgId="mohw" notices={byOrg.mohw} />
          <OrgSummaryCard orgId="nhis" notices={byOrg.nhis} />
          <OrgSummaryCard orgId="hira" notices={byOrg.hira} />
        </div>

        {total === 0 && (
          <div className="mt-8 text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">아직 수집된 공지사항이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">우측 상단의 새로고침 버튼을 눌러 공지를 수집해 주세요</p>
          </div>
        )}
      </main>
    </>
  )
}
