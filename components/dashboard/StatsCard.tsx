import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'amber' | 'violet'
}

const colorMap = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-700' },
  green:  { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700' },
  amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-600',  text: 'text-amber-700' },
  violet: { bg: 'bg-violet-50', icon: 'bg-violet-100 text-violet-600', text: 'text-violet-700' },
}

export function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue' }: StatsCardProps) {
  const c = colorMap[color]
  return (
    <div className={cn('rounded-xl p-5 border border-gray-200 bg-white')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={cn('text-3xl font-bold mt-1', c.text)}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-2.5 rounded-lg', c.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
