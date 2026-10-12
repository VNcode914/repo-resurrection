import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/studio/Button'
import { ChannelDot } from '@/components/studio/ChannelDot'
import { StatusBadge } from '@/components/studio/Badge'
import { useStore } from '@/lib/studio/store'
import { useStudio } from '@/lib/studio/studio-context'
import { formatDateLabel } from '@/lib/studio/types'

export const Route = createFileRoute('/bin')({
  head: () => ({
    meta: [
      { title: 'Recently Deleted · CreatorHub' },
      { name: 'description', content: 'Restore or permanently delete content you removed.' },
      { property: 'og:title', content: 'Recently Deleted · CreatorHub' },
      { property: 'og:description', content: 'Restore or permanently delete content you removed.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Bin,
})

function Bin() {
  const { content, restoreContent, permanentlyDeleteContent } = useStore()
  const { setNotice } = useStudio()

  const deleted = useMemo(
    () =>
      content
        .filter((c) => c.deletedAt)
        .sort((a, b) => (a.deletedAt! < b.deletedAt! ? 1 : -1)),
    [content],
  )

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 pb-10">
      <header className="enter">
        <h1 className="font-display text-[clamp(2rem,4vw,3.15rem)] font-semibold leading-[1.05] tracking-tight text-ink">
          Recently Deleted
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Deleted content lands here. Restore it, or remove it for good.
        </p>
      </header>

      <section className="enter enter-delay-1 panel p-4 sm:p-6">
        {deleted.length === 0 ? (
          <div className="empty-state flex flex-col items-center gap-3 text-muted">
            <Trash2 className="size-8 text-ink/30" />
            <p className="font-display text-lg text-ink">Nothing here</p>
            <p className="text-sm">Content you delete will show up here first.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {deleted.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-[14px] border border-ink/6 bg-paper/40 p-4"
              >
                <ChannelDot channel={item.platform} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted">
                    {item.platform} · deleted {formatDateLabel(item.deletedAt?.slice(0, 10) ?? null)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
                <div className="flex gap-2">
                  <Button
                    variant="quiet"
                    className="text-xs"
                    onClick={() => {
                      restoreContent(item.id)
                      setNotice(`"${item.title}" restored.`)
                    }}
                  >
                    <RotateCcw className="size-3.5" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs text-red-600 hover:bg-red-500/10"
                    onClick={() => {
                      if (window.confirm('Permanently delete this content? This cannot be undone.')) {
                        permanentlyDeleteContent(item.id)
                        setNotice('Permanently deleted.')
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    Delete forever
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
