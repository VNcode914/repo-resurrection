import type { Platform } from '@/lib/studio/types'
import { cn } from '@/lib/cn'

const dotColor: Record<Platform, string> = {
  YouTube: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
  Instagram: 'bg-gradient-to-tr from-amber-500 to-pink-500 shadow-[0_0_8px_rgba(217,70,239,0.4)]',
  X: 'bg-slate-800 shadow-[0_0_8px_rgba(30,41,59,0.5)]',
  LinkedIn: 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]',
  Blogs: 'bg-copper shadow-[0_0_8px_rgba(217,119,87,0.4)]',
  TikTok: 'bg-black shadow-[0_0_8px_rgba(0,0,0,0.3)]',
  Other: 'bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.4)]',
}

export function ChannelDot({
  channel,
  className,
}: {
  channel: Platform
  className?: string
}) {
  return (
    <span
      className={cn('inline-block size-2 shrink-0 rounded-full', dotColor[channel], className)}
      aria-hidden="true"
    />
  )
}
