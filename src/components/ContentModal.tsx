import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/lib/studio/store'
import { useStudio } from '@/lib/studio/studio-context'
import {
  PLATFORMS,
  STATUS_ORDER,
  platformFormats,
  statusCopy,
  type ContentItem,
  type ContentStatus,
  type Platform,
} from '@/lib/studio/types'

type Props = {
  item: ContentItem | null
  onClose: () => void
}

export function ContentModal({ item, onClose }: Props) {
  const { addContent, updateContent } = useStore()
  const { setNotice } = useStudio()

  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [platform, setPlatform] = useState<Platform>(item?.platform ?? 'YouTube')
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? 'idea')
  const [format, setFormat] = useState(item?.format ?? platformFormats['YouTube'][0])
  const [topic, setTopic] = useState(item?.topic ?? '')
  const [tags, setTags] = useState(item?.tags.join(', ') ?? '')
  const [plannedDate, setPlannedDate] = useState(item?.plannedDate ?? '')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const data = {
      title,
      description,
      platform,
      status,
      format,
      topic,
      tags: parsedTags,
      plannedDate: plannedDate || null,
    }

    if (item) {
      updateContent(item.id, data)
      setNotice('Content updated.')
    } else {
      addContent(data)
      setNotice('Idea saved.')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="mobile-overlay" onClick={onClose} aria-hidden="true" />

      <div className="enter relative z-50 max-h-[90svh] w-full max-w-[520px] overflow-y-auto rounded-[24px] bg-ivory p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4">
          <h2 className="font-display text-xl font-semibold">
            {item ? 'Edit content' : 'Capture idea'}
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
            <label className="field-label">Title</label>
            <input
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field-input"
              placeholder="e.g. My new setup..."
            />
          </div>

          <div>
            <label className="field-label">Description / notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field-input resize-none"
              placeholder="Jot down the angle, outline, or key points..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Platform</label>
              <select
                value={platform}
                onChange={(e) => {
                  const next = e.target.value as Platform
                  setPlatform(next)
                  setFormat(platformFormats[next][0])
                }}
                className="field-input"
              >
                {PLATFORMS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="field-input"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {statusCopy[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="field-input"
              >
                {platformFormats[platform].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Planned date</label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="field-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="field-input"
                placeholder="e.g. Design"
              />
            </div>
            <div>
              <label className="field-label">Tags</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="field-input"
                placeholder="gear, tips"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-ink/10 pt-4">
            <Button variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {item ? 'Save changes' : 'Save idea'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
