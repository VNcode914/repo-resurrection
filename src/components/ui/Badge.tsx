import { statusCopy, type ContentStatus } from '@/lib/studio/types'
import { cn } from '@/lib/cn'

const styles: Record<ContentStatus, string> = {
  idea: 'bg-sand/70 text-ink',
  planned: 'bg-pine-soft text-pine',
  'in-progress': 'bg-copper-soft text-copper-deep',
  'in-review': 'bg-copper/15 text-copper-deep',
  published: 'bg-ink text-cream',
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        styles[status],
      )}
    >
      {statusCopy[status]}
    </span>
  )
}
