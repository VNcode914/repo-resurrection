import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Check, CheckSquare, Edit2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TaskModal } from '@/components/TaskModal'
import { useStore } from '@/lib/studio/store'
import { useStudio } from '@/lib/studio/studio-context'
import { formatDateLabel, todayString, type TaskItem } from '@/lib/studio/types'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/tasks')({
  head: () => ({
    meta: [
      { title: 'Tasks · CreatorHub' },
      { name: 'description', content: 'Track the work needed to create and publish each piece of content.' },
      { property: 'og:title', content: 'Tasks · CreatorHub' },
      { property: 'og:description', content: 'Track the work needed to create and publish each piece of content.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: TasksPage,
})

function TasksPage() {
  const { tasks, content, toggleTask, deleteTask } = useStore()
  const { setNotice } = useStudio()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TaskItem | null>(null)
  const [filter, setFilter] = useState<'open' | 'done' | 'all'>('open')

  const contentById = useMemo(() => new Map(content.map((c) => [c.id, c])), [content])
  const today = todayString()

  const visible = useMemo(() => {
    const list = tasks.filter((t) =>
      filter === 'all' ? true : filter === 'done' ? t.done : !t.done,
    )
    return [...list].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate < b.dueDate ? -1 : 1
    })
  }, [tasks, filter])

  const openCount = tasks.filter((t) => !t.done).length

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 pb-10">
      <header className="enter flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[clamp(2rem,4vw,3.15rem)] font-semibold leading-[1.05] tracking-tight text-ink">
            Tasks
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            The work needed to finish each piece of content. {openCount} open.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus className="size-4" />
          New task
        </Button>
      </header>

      <section className="enter enter-delay-1 panel p-4 sm:p-6">
        <div className="flex gap-1.5" role="tablist" aria-label="Filter tasks">
          {(
            [
              { id: 'open', label: 'Open' },
              { id: 'done', label: 'Done' },
              { id: 'all', label: 'All' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200',
                filter === f.id ? 'bg-ink text-ivory' : 'bg-paper text-muted hover:text-ink',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state mt-6 flex flex-col items-center gap-3 text-muted">
            <CheckSquare className="size-8 text-ink/30" />
            <p className="font-display text-lg text-ink">No tasks yet</p>
            <p className="text-sm">Add a task like "Record the video" and link it to a content item.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state mt-6">
            <p className="font-display text-lg">Nothing in this view.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-1">
            {visible.map((task) => {
              const linked = task.contentId ? contentById.get(task.contentId) : null
              const overdue = !task.done && task.dueDate && task.dueDate < today
              return (
                <li
                  key={task.id}
                  className="group flex items-start gap-3 rounded-[12px] px-2 py-2.5 transition-colors duration-200 hover:bg-paper"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="flex flex-1 items-start gap-3 text-left"
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
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-sm leading-snug',
                          task.done && 'text-muted line-through',
                        )}
                      >
                        {task.title}
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        {task.dueDate ? formatDateLabel(task.dueDate) : 'No due date'}
                        {overdue ? ' · overdue' : ''}
                        {linked ? ` · ${linked.title}` : ''}
                      </span>
                      {task.notes && (
                        <span className="mt-1 block text-xs text-muted/80">{task.notes}</span>
                      )}
                    </span>
                  </button>
                  <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditing(task)
                        setModalOpen(true)
                      }}
                      className="rounded p-1 text-muted hover:bg-ink/10 hover:text-ink"
                      aria-label="Edit task"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this task?')) {
                          deleteTask(task.id)
                          setNotice('Task deleted.')
                        }
                      }}
                      className="rounded p-1 text-muted hover:bg-red-500/10 hover:text-red-600"
                      aria-label="Delete task"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {modalOpen && (
        <TaskModal
          task={editing}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
