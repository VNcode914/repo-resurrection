import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/lib/studio/store'
import { useStudio } from '@/lib/studio/studio-context'
import type { TaskItem } from '@/lib/studio/types'

type Props = {
  task: TaskItem | null
  defaultContentId?: string | null
  defaultDueDate?: string | null
  onClose: () => void
}

export function TaskModal({ task, defaultContentId, defaultDueDate, onClose }: Props) {
  const { content, addTask, updateTask } = useStore()
  const { setNotice } = useStudio()

  const [title, setTitle] = useState(task?.title ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDueDate ?? '')
  const [contentId, setContentId] = useState(task?.contentId ?? defaultContentId ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')

  const activeContent = content.filter((c) => !c.deletedAt)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      title,
      dueDate: dueDate || null,
      contentId: contentId || null,
      notes,
    }
    if (task) {
      updateTask(task.id, data)
      setNotice('Task updated.')
    } else {
      addTask(data)
      setNotice('Task added.')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="mobile-overlay" onClick={onClose} aria-hidden="true" />
      <div className="enter relative z-50 w-full max-w-[480px] rounded-[24px] bg-ivory p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4">
          <h2 className="font-display text-xl font-semibold">
            {task ? 'Edit task' : 'New task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] p-2 text-muted hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="field-label">Task</label>
            <input
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field-input"
              placeholder="e.g. Record the video"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Linked content</label>
              <select
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
                className="field-input"
              >
                <option value="">None</option>
                {activeContent.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Notes (optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field-input resize-none"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-ink/10 pt-4">
            <Button variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {task ? 'Save changes' : 'Add task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
