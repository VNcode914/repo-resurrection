import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/studio/Button'
import { useStore } from '@/lib/studio/store'
import { useStudio } from '@/lib/studio/studio-context'
import { creator } from '@/lib/studio/types'

export const Route = createFileRoute('/settings')({
  head: () => ({
    meta: [
      { title: 'Settings · CreatorHub' },
      { name: 'description', content: 'Your studio profile and data settings.' },
      { property: 'og:title', content: 'Settings · CreatorHub' },
      { property: 'og:description', content: 'Your studio profile and data settings.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Settings,
})

function Settings() {
  const { content, tasks } = useStore()
  const { setNotice } = useStudio()
  const [confirming, setConfirming] = useState(false)

  const active = content.filter((c) => !c.deletedAt).length
  const deleted = content.length - active

  function exportData() {
    const blob = new Blob(
      [JSON.stringify({ content, tasks }, null, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'creatorhub-backup.json'
    a.click()
    URL.revokeObjectURL(url)
    setNotice('Backup downloaded.')
  }

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-6 pb-10">
      <header className="enter">
        <h1 className="font-display text-[clamp(2rem,4vw,3.15rem)] font-semibold leading-[1.05] tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-2 text-[15px] text-muted">Your studio, your data.</p>
      </header>

      <section className="enter enter-delay-1 panel p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">Profile</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">Name</dt>
            <dd className="mt-0.5 font-medium">{creator.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">Handle</dt>
            <dd className="mt-0.5 font-medium">{creator.handle}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">Role</dt>
            <dd className="mt-0.5 font-medium">{creator.role}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">Studio</dt>
            <dd className="mt-0.5 font-medium">{creator.studio}</dd>
          </div>
        </dl>
      </section>

      <section className="enter enter-delay-2 panel p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">Your data</h2>
        <p className="mt-2 text-sm text-muted">
          Everything is saved in this browser. You currently have {active} content item
          {active === 1 ? '' : 's'}, {deleted} in Recently Deleted, and {tasks.length} task
          {tasks.length === 1 ? '' : 's'}.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="quiet" onClick={exportData}>
            Download backup (JSON)
          </Button>
          {!confirming ? (
            <Button
              variant="ghost"
              className="text-red-600 hover:bg-red-500/10"
              onClick={() => setConfirming(true)}
            >
              Clear all data
            </Button>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-sm text-red-600">Really erase everything?</span>
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-500/10"
                onClick={() => {
                  window.localStorage.removeItem('creatorhub_content_v2')
                  window.localStorage.removeItem('creatorhub_tasks_v2')
                  window.localStorage.setItem('creatorhub_migrated_v2', '1')
                  window.location.reload()
                }}
              >
                Yes, erase
              </Button>
              <Button variant="quiet" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </span>
          )}
        </div>
      </section>
    </div>
  )
}
