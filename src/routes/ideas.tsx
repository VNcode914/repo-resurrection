import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Edit2, Lightbulb, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ChannelDot } from '@/components/ui/ChannelDot'
import { StatusBadge } from '@/components/ui/Badge'
import { ContentModal } from '@/components/ContentModal'
import { useStore } from '@/lib/studio/store'
import { useStudio } from '@/lib/studio/studio-context'
import {
  PLATFORMS,
  STATUS_ORDER,
  formatDateLabel,
  statusCopy,
  type ContentItem,
  type ContentStatus,
  type Platform,
} from '@/lib/studio/types'
import { cn } from '@/lib/cn'

type IdeasSearch = { new?: boolean }

export const Route = createFileRoute('/ideas')({
  validateSearch: (search: Record<string, unknown>): IdeasSearch => ({
    new: search.new === true || search.new === 'true' ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Ideas · CreatorHub' },
      { name: 'description', content: 'Create, search, filter, and schedule your content ideas.' },
      { property: 'og:title', content: 'Ideas · CreatorHub' },
      { property: 'og:description', content: 'Create, search, filter, and schedule your content ideas.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Ideas,
})

function Ideas() {
  const { content, deleteContent } = useStore()
  const { setNotice } = useStudio()
  const { new: openNew } = Route.useSearch()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all')
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ContentItem | null>(null)

  useEffect(() => {
    if (openNew) {
      setEditing(null)
      setModalOpen(true)
      navigate({ to: '/ideas', search: {}, replace: true })
    }
  }, [openNew, navigate])

  const ideas = useMemo(() => content.filter((c) => !c.deletedAt), [content])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return ideas.filter((idea) => {
      const matchStatus = statusFilter === 'all' || idea.status === statusFilter
      const matchPlatform = platformFilter === 'all' || idea.platform === platformFilter
      const matchQuery =
        needle.length === 0 ||
        `${idea.title} ${idea.description} ${idea.topic} ${idea.format} ${idea.tags.join(' ')}`
          .toLowerCase()
          .includes(needle)
      return matchStatus && matchPlatform && matchQuery
    })
  }, [ideas, query, statusFilter, platformFilter])

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 pb-10">
      <header className="enter flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[clamp(2rem,4vw,3.15rem)] font-semibold leading-[1.05] tracking-tight text-ink">
            Ideas
          </h1>
          <p className="mt-2 text-[15px] text-muted">The scratchpad for your content studio.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus className="size-4" />
          New idea
        </Button>
      </header>

      <section className="enter enter-delay-1 flex flex-col gap-4 rounded-[20px] bg-ivory p-4 shadow-[var(--shadow-board)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-ink/[0.04] px-3 py-2 sm:max-w-xs">
            <Search className="size-4 shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ideas..."
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ContentStatus)}
            className="rounded-[10px] border border-ink/10 bg-transparent px-3 py-1.5 text-sm text-ink outline-none"
          >
            <option value="all">All statuses</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {statusCopy[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:pb-0">
          <button
            onClick={() => setPlatformFilter('all')}
            className={cn(
              'whitespace-nowrap rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors',
              platformFilter === 'all' ? 'bg-ink text-ivory' : 'bg-ink/5 hover:bg-ink/10',
            )}
          >
            All Ideas
            <span className="ml-2 rounded-full bg-black/20 px-1.5 py-0.5 text-xs opacity-60">
              {ideas.length}
            </span>
          </button>
          {PLATFORMS.map((p) => {
            const count = ideas.filter((i) => i.platform === p).length
            return (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={cn(
                  'whitespace-nowrap rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors',
                  platformFilter === p ? 'bg-ink text-ivory' : 'bg-ink/5 hover:bg-ink/10',
                )}
              >
                {p}
                <span
                  className={cn(
                    'ml-2 rounded-full px-1.5 py-0.5 text-xs opacity-60',
                    platformFilter === p ? 'bg-white/20' : 'bg-black/10 text-ink/70',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {ideas.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-ink/15 px-5 py-16 text-center text-muted">
            <Lightbulb className="size-8 text-ink/30" />
            <p className="font-display text-lg text-ink">No ideas yet</p>
            <p className="text-sm">Click "New idea" to start capturing inspiration.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-4 rounded-[14px] border border-dashed border-ink/15 px-5 py-10 text-center">
            <p className="font-display text-lg">Nothing matches your search.</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((idea) => (
              <li
                key={idea.id}
                className="group relative flex flex-col gap-3 rounded-[16px] border border-ink/6 bg-paper/30 p-5 transition-colors hover:bg-paper/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold leading-snug">{idea.title}</h3>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditing(idea)
                        setModalOpen(true)
                      }}
                      className="rounded p-1 text-muted hover:bg-ink/10 hover:text-ink"
                      aria-label="Edit"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Move this idea to Recently Deleted?')) {
                          deleteContent(idea.id)
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
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
                  <ChannelDot channel={idea.platform} />
                  <span>{idea.platform}</span>
                  {idea.format && (
                    <>
                      <span>·</span>
                      <span>{idea.format}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={idea.status} />
                  {idea.plannedDate && (
                    <span className="text-xs text-muted">{formatDateLabel(idea.plannedDate)}</span>
                  )}
                </div>
                {idea.description && (
                  <p className="line-clamp-3 text-sm text-ink/75">{idea.description}</p>
                )}
                {(idea.topic || idea.tags.length > 0) && (
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                    {idea.topic && (
                      <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-ink/70">
                        {idea.topic}
                      </span>
                    )}
                    {idea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-ink/70"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {modalOpen && (
        <ContentModal
          item={editing}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
