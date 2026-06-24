'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Bell,
  Bot,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/notices', label: '공지사항', icon: Bell },
  { href: '/ai', label: 'AI 어시스턴트', icon: Bot },
]

const orgs = [
  { id: 'kha',  label: '대한병원협회',       color: '#1D4ED8', url: 'https://www.kha.or.kr' },
  { id: 'mohw', label: '보건복지부',         color: '#065F46', url: 'https://www.mohw.go.kr' },
  { id: 'nhis', label: '국민건강보험공단',   color: '#0E7490', url: 'https://www.nhis.or.kr' },
  { id: 'hira', label: '건강보험심사평가원', color: '#7C3AED', url: 'https://www.hira.or.kr' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-white">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <img
            src="/logo.PNG"
            alt="좋은삼선병원 로고"
            className="w-9 h-9 object-contain rounded-lg"
          />
          <div>
            <p className="font-bold text-sm leading-tight">좋은삼선병원</p>
            <p className="text-xs text-gray-400 leading-tight">공지 허브</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">메뉴</p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
            {pathname === href && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
          </Link>
        ))}

        {/* Organizations */}
        <div className="pt-4">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">기관 바로가기</p>
          {orgs.map((org) => (
            <a
              key={org.id}
              href={org.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition-colors group"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: org.color }} />
              <span className="flex-1 truncate">{org.label}</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">원무팀 · 심사팀 전용</p>
        <p className="text-xs text-gray-600 mt-0.5">v1.0.0</p>
      </div>
    </aside>
  )
}
