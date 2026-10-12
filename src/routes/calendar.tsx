import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Edit2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ChannelDot } from '@/components/ui/ChannelDot'
import { StatusBadge } from '@/components/ui/Badge'
import { ContentModal } from '@/components/ContentModal'
import { ScheduleModal } from '@/components/ScheduleModal'
import { useStore } from '@/lib/studio/store'
import { useStudio } from '@/lib/studio/studio-context'
import {
  formatDateLabel,
  toLocalDateString,
  todayString,
  type ContentItem,
} from '@/lib/studio/types'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/calendar')({
  head: () => ({
    meta: [
      { title: 'Calendar · CreatorHub' },
      { name: 'description', content: 'Schedule saved ideas onto dates and manage planned content.' },
      { property: 'og:title', content: 'Calendar · CreatorHub' },
      { property: 'og:description', content: 'Schedule saved ideas onto dates and manage planned content.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: CalendarPage,
})

function CalendarPage() {
  const { content, deleteContent } = useStore()
  const { setNotice } = useStudio()

  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(todayString())
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editing, setEditing] = useState<ContentItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const active = useMemo(() => content.filter((c) => !c.deletedAt), [content])
  const byDate = useMemo(() => {
    const map = new Map<string, ContentItem[]>()
    for (const item of active) {
      if (!item.plannedDate) continue
      const list = map.get(item.plannedDate) ?? []
      list.push(item)
      map.set(item.plannedDate, list)
    }
    return map
  }, [active])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<string | null> = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toLocalDateString(new Date(year, month, d)))
  }

  const monthLabel = viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const selectedItems = byDate.get(selectedDate) ?? []
  const today = todayString()

  function shiftMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1))
  }

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 pb-10">
      <header className="enter flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[clamp(2rem,4vw,3.15rem)] font-semibold leading-[1.05] tracking-tight text-ink">
            Calendar
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            Decide when each piece of content should go out.
          </p>
        </div>
        <Button variant="primary" onClick={() => setScheduleOpen(true)}>
          <Plus className="size-4" />
          Add content
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Month grid */}
        <section className="enter enter-delay-1 panel p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">{monthLabel}</h2>
            <div className="flex gap-1">
              <button
                onClick={() => shiftMonth(-1)}
                className="rounded-[10px] p-2 text-muted hover:bg-ink/5 hover:text-ink"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => {
                  setViewDate(new Date())
                  setSelectedDate(today)
                }}
                className="rounded-[10px] px-3 py-1.5 text-sm font-medium text-muted hover:bg-ink/5 hover:text-ink"
              >
                Today
              </button>
              <button
                onClick={() => shiftMonth(1)}
                className="rounded-[10px] p-2 text-muted hover:bg-ink/5 hover:text-ink"
                aria-label="Next month"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((dateStr, i) =>
              dateStr === null ? (
                <div key={`empty-${i}`} />
              ) : (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    'flex min-h-[64px] flex-col items-start gap-1 rounded-[10px] border p-1.5 text-left transition-colors sm:min-h-[76px]',
                    selectedDate === dateStr
                      ? 'border-copper bg-copper/5'
                      : 'border-transparent hover:bg-ink/[0.04]',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                      dateStr === today ? 'bg-ink text-ivory' : 'text-ink/70',
                    )}
                  >
                    {Number(dateStr.split('-')[2])}
                  </span>
                  <span className="flex w-full flex-col gap-0.5">
                    {(byDate.get(dateStr) ?? []).slice(0, 2).map((item) => (
                      <span
                        key={item.id}
                        className="flex w-full items-center gap-1 truncate rounded bg-pine-soft px-1 py-0.5 text-[10px] font-medium text-pine"
                      >
                        <ChannelDot channel={item.platform} className="size-1.5" />
                        <span className="truncate">{item.title}</span>
                      </span>
                    ))}
                    {(byDate.get(dateStr)?.length ?? 0) > 2 && (
                      <span className="text-[10px] text-muted">
                        +{(byDate.get(dateStr)?.length ?? 0) - 2} more
                      </span>
                    )}
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        {/* Selected day */}
        <aside className="enter enter-delay-2 panel h-fit p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">{formatDateLabel(selectedDate)}</h2>
            <Button variant="quiet" className="text-xs" onClick={() => setScheduleOpen(true)}>
              <Plus className="size-3.5" />
              Add content
            </Button>
          </div>

          {selectedItems.length === 0 ? (
            <div className="empty-state mt-4">
              <p className="font-display text-lg text-ink">Nothing on this date</p>
              <p className="mt-1 text-sm text-muted">
                Use "Add content" to schedule a saved idea here.
              </p>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {selectedItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-[14px] border border-ink/6 bg-paper/40 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditing(item)
                          setEditOpen(true)
                        }}
                        className="rounded p-1 text-muted hover:bg-ink/10 hover:text-ink"
                        aria-label="Edit"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Move this content to Recently Deleted?')) {
                            deleteContent(item.id)
                            setNotice('Moved to Recently Deleted.')
                          }
                        }}
                        className="rounded p-1 text-muted hover:bg-red-500/10 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <ChannelDot channel={item.platform} />
                    {item.platform}
                    {item.format ? ` · ${item.format}` : ''}
                  </div>
                  <StatusBadge status={item.status} />
                  {item.description && (
                    <p className="line-clamp-2 text-sm text-muted">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {scheduleOpen && (
        <ScheduleModal
          date={selectedDate}
          onClose={() => setScheduleOpen(false)}
          onCreateNew={() => {
            setScheduleOpen(false)
            setEditing(null)
            setEditOpen(true)
          }}
        />
      )}
      {editOpen && (
        <ContentModal
          item={editing}
          onClose={() => {
            setEditOpen(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
