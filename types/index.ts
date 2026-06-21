export interface Organization {
  id: string
  name: string
  short_name: string
  url: string
  color: string
  bg_color: string
  created_at: string
}

export interface Notice {
  id: string
  organization_id: string
  title: string
  content: string | null
  url: string
  category: string | null
  published_at: string | null
  is_important: boolean
  view_count: number
  created_at: string
  updated_at: string
  organizations?: Organization
  notice_summaries?: NoticeSummary[]
  bookmarks?: Bookmark[]
}

export interface NoticeSummary {
  id: string
  notice_id: string
  summary: string
  key_points: string[]
  impact_level: 'high' | 'medium' | 'low'
  created_at: string
}

export interface Bookmark {
  id: string
  notice_id: string
  note: string | null
  created_at: string
}

export interface CrawledNotice {
  organization_id: string
  title: string
  url: string
  content?: string
  category?: string
  published_at?: string
  is_important?: boolean
}

export interface DashboardStats {
  total: number
  today: number
  important: number
  byOrg: Record<string, number>
}
