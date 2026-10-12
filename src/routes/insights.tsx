import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useStore } from '@/lib/studio/store'
import { PLATFORMS, STATUS_ORDER, statusCopy } from '@/lib/studio/types'
import { ChannelDot } from '@/components/ui/ChannelDot'

export const Route = createFileRoute('/insights')({
  head: () => ({
    meta: [
      { title: 'Insights · CreatorHub' },
      { name: 'description', content: 'Real counts of your content by status and platform.' },
      { property: 'og:title', content: 'Insights · CreatorHub' },
      { property: 'og:description', content: 'Real counts of your content by status and platform.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Insights,
})

function Insights() {
  const { content, tasks } = useStore()
  const active = useMemo(() => content.filter((c) => !c.deletedAt), [content])

  const maxStatus = Math.max(1, ...STATUS_ORDER.map((s) => active.filter((c) => c.status === s).length))
  const maxPlatform = Math.max(1, ...PLATFORMS.map((p) => active.filter((c) => c.platform === p).length))
  const doneTasks = tasks.filter((t) => t.done).length

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 pb-10">
      <header className="enter">
        <h1 className="font-display text-[clamp(2rem,4vw,3.15rem)] font-semibold leading-[1.05] tracking-tight text-ink">
          Insights
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          A honest look at your studio — every number comes from your saved content and tasks.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="enter enter-delay-1 panel p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Content by status</h2>
          <ul className="mt-5 flex flex-col gap-3">
            {STATUS_ORDER.map((s) => {
              const count = active.filter((c) => c.status === s).length
              return (
                <li key={s} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-muted">{statusCopy[s]}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/5">
                    <span
                      className="block h-full rounded-full bg-copper transition-all"
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-sm font-semibold tabular-nums">{count}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="enter enter-delay-2 panel p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Content by platform</h2>
          <ul className="mt-5 flex flex-col gap-3">
            {PLATFORMS.map((p) => {
              const count = active.filter((c) => c.platform === p).length
              return (
                <li key={p} className="flex items-center gap-3">
                  <span className="flex w-24 items-center gap-2 text-sm text-muted">
                    <ChannelDot channel={p} />
                    {p}
                  </span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/5">
                    <span
                      className="block h-full rounded-full bg-pine transition-all"
                      style={{ width: `${(count / maxPlatform) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-sm font-semibold tabular-nums">{count}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="enter enter-delay-3 panel p-5 sm:p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-semibold">Tasks</h2>
          <p className="mt-3 text-sm text-muted">
            {tasks.length === 0
              ? 'No tasks yet — add some from the Tasks page.'
              : `${doneTasks} of ${tasks.length} tasks completed.`}
          </p>
          {tasks.length > 0 && (
            <span className="mt-3 block h-2.5 w-full overflow-hidden rounded-full bg-ink/5">
              <span
                className="block h-full rounded-full bg-pine transition-all"
                style={{ width: `${(doneTasks / tasks.length) * 100}%` }}
              />
            </span>
          )}
        </section>
      </div>
    </div>
  )
}
