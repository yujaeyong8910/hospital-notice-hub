import { cn, ORG_META } from '@/lib/utils'

interface OrgBadgeProps {
  orgId: string
  size?: 'sm' | 'md'
}

export function OrgBadge({ orgId, size = 'sm' }: OrgBadgeProps) {
  const meta = ORG_META[orgId]
  if (!meta) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        meta.badge,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {meta.label}
    </span>
  )
}
