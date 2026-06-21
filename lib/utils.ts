import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '날짜 미상'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '날짜 미상'
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '방금 전'
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return formatDate(dateStr)
}

export const ORG_META: Record<string, { label: string; color: string; bg: string; border: string; badge: string }> = {
  kha:  { label: '대한병원협회',       color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', badge: 'bg-blue-100 text-blue-800'   },
  mohw: { label: '보건복지부',         color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', badge: 'bg-emerald-100 text-emerald-800' },
  nhis: { label: '국민건강보험공단',   color: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC', badge: 'bg-cyan-100 text-cyan-800'    },
  hira: { label: '건강보험심사평가원', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', badge: 'bg-violet-100 text-violet-800' },
}
