import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/lib/studio/store'
import { statusCopy, todayString } from '@/lib/studio/types'

export const Route = createFileRoute('/ai')({
  head: () => ({
    meta: [
      { title: 'AI Companion · CreatorHub' },
      { name: 'description', content: 'A studio companion that answers from your real saved content and tasks.' },
      { property: 'og:title', content: 'AI Companion · CreatorHub' },
      { property: 'og:description', content: 'A studio companion that answers from your real saved content and tasks.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: AiCompanion,
})

type Message = { role: 'user' | 'assistant'; text: string }

function AiCompanion() {
  const { content, tasks } = useStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hi! I can answer questions about your saved ideas, schedule, and tasks. Try "What is planned for today?" or "How many ideas do I have?"',
    },
  ])
  const [input, setInput] = useState('')

  const active = useMemo(() => content.filter((c) => !c.deletedAt), [content])

  function answer(question: string): string {
    const q = question.toLowerCase()
    const today = todayString()

    if (q.includes('today')) {
      const todays = active.filter((c) => c.plannedDate === today)
      const todaysTasks = tasks.filter((t) => t.dueDate === today && !t.done)
      const parts: string[] = []
      parts.push(
        todays.length
          ? `Scheduled for today: ${todays.map((c) => `"${c.title}" (${c.platform})`).join(', ')}.`
          : 'Nothing is scheduled for today.',
      )
      parts.push(
        todaysTasks.length
          ? `Open tasks due today: ${todaysTasks.map((t) => t.title).join(', ')}.`
          : 'No open tasks due today.',
      )
      return parts.join(' ')
    }
    if (q.includes('idea')) {
      const ideas = active.filter((c) => c.status === 'idea')
      return ideas.length
        ? `You have ${ideas.length} idea${ideas.length === 1 ? '' : 's'} waiting: ${ideas
            .slice(0, 5)
            .map((c) => `"${c.title}"`)
            .join(', ')}${ideas.length > 5 ? `, and ${ideas.length - 5} more` : ''}.`
        : 'You have no unsaved ideas right now. Capture one on the Ideas page!'
    }
    if (q.includes('task')) {
      const open = tasks.filter((t) => !t.done)
      return open.length
        ? `You have ${open.length} open task${open.length === 1 ? '' : 's'}: ${open
            .slice(0, 5)
            .map((t) => t.title)
            .join(', ')}.`
        : 'All tasks are done. Nice work!'
    }
    if (q.includes('publish')) {
      const published = active.filter((c) => c.status === 'published')
      return published.length
        ? `You have published ${published.length} piece${published.length === 1 ? '' : 's'}: ${published
            .map((c) => `"${c.title}"`)
            .join(', ')}.`
        : 'Nothing published yet. Move a piece through the workflow to mark it Published.'
    }
    if (q.includes('status') || q.includes('overview') || q.includes('summary')) {
      const counts = active.reduce<Record<string, number>>((acc, c) => {
        acc[c.status] = (acc[c.status] ?? 0) + 1
        return acc
      }, {})
      return (
        'Here is your studio at a glance: ' +
        Object.entries(counts)
          .map(([s, n]) => `${n} ${statusCopy[s as keyof typeof statusCopy]}`)
          .join(', ') +
        '.'
      )
    }
    return 'I can help with your ideas, schedule, tasks, and publishing status. Try asking "What is planned for today?" or "Show my open tasks".'
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question) return
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: answer(question) },
    ])
    setInput('')
  }

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-6 pb-10">
      <header className="enter">
        <h1 className="flex items-center gap-3 font-display text-[clamp(2rem,4vw,3.15rem)] font-semibold leading-[1.05] tracking-tight text-ink">
          <Bot className="size-8 text-copper" />
          AI Companion
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Answers based on your real saved content and tasks — nothing invented.
        </p>
      </header>

      <section className="enter enter-delay-1 panel flex min-h-[420px] flex-col p-5">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === 'user'
                  ? 'ml-auto max-w-[80%] rounded-[14px] bg-ink px-4 py-2.5 text-sm text-ivory'
                  : 'mr-auto max-w-[80%] rounded-[14px] bg-paper px-4 py-2.5 text-sm text-ink'
              }
            >
              {m.text}
            </div>
          ))}
        </div>
        <form onSubmit={onSubmit} className="mt-4 flex gap-2 border-t border-ink/10 pt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your studio..."
            className="field-input !mt-0 flex-1"
          />
          <Button type="submit" variant="primary" disabled={!input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </section>
    </div>
  )
}
