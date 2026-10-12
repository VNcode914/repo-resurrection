import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  FileText,
  Lightbulb,
  Radio,
  Send,
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ChannelDot } from '@/components/ui/ChannelDot'
import { useStudio } from '@/lib/studio/studio-context'
import { useStore } from '@/lib/studio/store'
import { creator, formatDateLabel, todayString } from '@/lib/studio/types'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Dashboard · CreatorHub' },
      {
        name: 'description',
        content: "Today's scheduled content, today's tasks, and real counts from your saved ideas and content.",
      },
      { property: 'og:title', content: 'Dashboard · CreatorHub' },
      {
        property: 'og:description',
        content: "Today's scheduled content, today's tasks, and real counts from your saved ideas and content.",
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Dashboard,
})

function Dashboard() {
  const { query } = useStudio()
  const { content, tasks, toggleTask, hydrated } = useStore()

  const today = todayString()
  const active = useMemo(() => content.filter((c) => !c.deletedAt), [content])

  const todaysContent = useMemo(
    () =>
      active
        .filter((c) => c.plannedDate === today)
        .filter((c) =>
          query.trim()
            ? `${c.title} ${c.platform} ${c.format}`.toLowerCase().includes(query.trim().toLowerCase())
            : true,
        ),
    [active, today, query],
  )

  const todaysTasks = useMemo(
    () => tasks.filter((t) => t.dueDate === today),
    [tasks, today],
  )

  const nextUp = useMemo(() => {
    const upcoming = active
      .filter((c) => c.plannedDate && c.plannedDate >= today && c.status !== 'published')
      .sort((a, b) => (a.plannedDate! < b.plannedDate! ? -1 : 1))
    return upcoming[0] ?? null
  }, [active, today])

  const stats = useMemo(() => {
    const count = (s: string) => active.filter((c) => c.status === s).length
    return [
      { label: 'Ideas', value: count('idea'), icon: Lightbulb },
      { label: 'Planned', value: count('planned'), icon: Clock },
      { label: 'In progress', value: count('in-progress'), icon: FileText },
      { label: 'In review', value: count('in-review'), icon: Radio },
      { label: 'Published', value: count('published'), icon: Send },
    ]
  }, [active])

  const openTasks = tasks.filter((t) => !t.done).length
  const contentById = useMemo(() => new Map(content.map((c) => [c.id, c])), [content])

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 pb-10">
      {/* Hero header */}
      <header className="enter grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-end">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted">
            {creator.handle} · {openTasks} open tasks
          </p>
          <h1 className="mt-2 font-display text-[clamp(2rem,4vw,3.15rem)] font-semibold leading-[1.05] tracking-tight text-ink">
            {greeting()}, {creator.name.split(' ')[0]}.
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
            Welcome back! Here's a quick overview of your saved ideas, upcoming posts, and tasks.
          </p>
        </div>

        {nextUp ? (
          <article className="enter enter-delay-1 relative overflow-hidden rounded-[18px] bg-ink px-5 py-5 text-cream shadow-[var(--shadow-board)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-copper-soft">
              Next post
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold leading-tight text-ivory">
              {nextUp.title}
            </h2>
            <p className="mt-2 text-sm text-cream/65">
              {nextUp.platform}
              {nextUp.format ? ` · ${nextUp.format}` : ''}
            </p>
            <p className="mt-4 text-sm text-cream/80">{formatDateLabel(nextUp.plannedDate)}</p>
          </article>
        ) : (
          <article className="enter enter-delay-1 relative overflow-hidden rounded-[18px] bg-ink px-5 py-5 text-cream shadow-[var(--shadow-board)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-copper-soft">
              Next post
            </p>
            <p className="mt-2 text-sm text-cream/80">
              Nothing scheduled yet. Plan your next post in the Calendar.
            </p>
            <Link to="/calendar" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-copper-soft hover:text-ivory">
              Open calendar <ArrowRight className="size-3.5" />
            </Link>
          </article>
        )}
      </header>

      {/* Stats strip — real counts from saved content */}
      <section className="enter enter-delay-1 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center gap-2">
              <stat.icon className="size-4 text-copper" />
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                {stat.label}
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-ink">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* Today's Content & Today's Tasks side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="enter enter-delay-2 panel p-4 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Today's Content
            </h2>
            <Link to="/calendar" className="text-xs font-medium text-copper hover:text-copper-deep">
              Schedule content
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted">Content planned for {formatDateLabel(today)}</p>

          {!hydrated ? null : todaysContent.length === 0 ? (
            <div className="empty-state mt-5">
              <Calendar className="mx-auto size-8 text-ink/30" />
              <p className="mt-3 font-display text-lg text-ink">Nothing scheduled for today</p>
              <p className="mt-1 text-sm text-muted">
                Pick a saved idea and schedule it from the Calendar.
              </p>
              <Link to="/calendar">
                <Button variant="quiet" className="mt-4">
                  Open Calendar
                </Button>
              </Link>
            </div>
          ) : (
            <ol className="mt-4">
              {todaysContent.map((item, index) => (
                <li
                  key={item.id}
                  className={cn(
                    'board-row grid gap-2 px-2 py-4',
                    index !== 0 && 'border-t border-ink/8',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <ChannelDot channel={item.platform} />
                    <h3 className="text-[15px] font-semibold leading-snug">{item.title}</h3>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-muted">
                    {item.platform}
                    {item.format ? ` · ${item.format}` : ''} · {formatDateLabel(item.plannedDate)}
                  </p>
                  {item.description ? (
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted">
                      {item.description}
                    </p>
                  ) : null}
                  <div>
                    <Link to="/calendar" className="text-xs font-medium text-copper hover:text-copper-deep">
                      Manage in Calendar
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="enter enter-delay-3 panel p-4 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Today's Tasks</h2>
            <Link to="/tasks" className="text-xs font-medium text-copper hover:text-copper-deep">
              All tasks
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted">
            {todaysTasks.filter((t) => !t.done).length} remaining today
          </p>

          {!hydrated ? null : todaysTasks.length === 0 ? (
            <div className="empty-state mt-5">
              <Check className="mx-auto size-8 text-ink/30" />
              <p className="mt-3 font-display text-lg text-ink">No tasks due today</p>
              <p className="mt-1 text-sm text-muted">Add a task and set its due date to today.</p>
              <Link to="/tasks">
                <Button variant="quiet" className="mt-4">
                  Add a task
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-1">
              {todaysTasks.map((task) => {
                const linked = task.contentId ? contentById.get(task.contentId) : null
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className="flex w-full items-start gap-3 rounded-[12px] px-2 py-2.5 text-left transition-colors duration-200 hover:bg-paper"
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                          task.done
                            ? 'border-pine bg-pine text-ivory'
                            : 'border-ink/20 text-transparent',
                        )}
                      >
                        {task.done ? <Check className="size-3" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            'block text-sm leading-snug transition-colors duration-200',
                            task.done && 'text-muted line-through',
                          )}
                        >
                          {task.title}
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          {formatDateLabel(task.dueDate)}
                          {linked ? ` · ${linked.title}` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Recent ideas */}
      {active.filter((c) => c.status === 'idea').length > 0 && (
        <section className="enter enter-delay-4 panel p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Recent ideas</h2>
            <Link to="/ideas" className="text-xs font-medium text-copper hover:text-copper-deep">
              All ideas
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active
              .filter((c) => c.status === 'idea')
              .slice(0, 3)
              .map((idea) => (
                <li
                  key={idea.id}
                  className="flex flex-col gap-1 rounded-[12px] p-3 transition-colors duration-200 hover:bg-paper"
                >
                  <span className="block text-sm font-semibold leading-snug">{idea.title}</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-muted">
                    <ChannelDot channel={idea.platform} className="size-1.5" />
                    {idea.platform} · Idea
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
