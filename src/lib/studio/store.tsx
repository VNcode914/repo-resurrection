import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  toLocalDateString,
  type ContentItem,
  type ContentStatus,
  type TaskItem,
} from './types'

const CONTENT_KEY = 'creatorhub_content_v2'
const TASKS_KEY = 'creatorhub_tasks_v2'
const MIGRATED_KEY = 'creatorhub_migrated_v2'

type StoreContextValue = {
  hydrated: boolean
  content: ContentItem[]
  addContent: (
    data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ) => ContentItem
  updateContent: (id: string, updates: Partial<ContentItem>) => void
  setContentStatus: (id: string, status: ContentStatus) => void
  scheduleContent: (id: string, date: string) => void
  deleteContent: (id: string) => void // soft delete
  restoreContent: (id: string) => void
  permanentlyDeleteContent: (id: string) => void

  tasks: TaskItem[]
  addTask: (data: Omit<TaskItem, 'id' | 'createdAt' | 'done'> & { done?: boolean }) => void
  updateTask: (id: string, updates: Partial<TaskItem>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider')
  }
  return ctx
}

const generateId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

/* ---------- Legacy migration (creatorhub_ideas / creatorhub_board / creatorhub_tasks) ---------- */

type LegacyIdea = {
  id: string
  title: string
  description: string
  channel: ContentItem['platform']
  format: string
  topic: string
  tags: string[]
  status: 'Inbox' | 'In Progress' | 'Ready' | 'Published'
  createdAt: string
  updatedAt: string
  isDeleted?: boolean
  deletedAt?: string
}

type LegacyBoardItem = {
  id: string
  title: string
  format: string
  channel: ContentItem['platform']
  status: 'draft' | 'review' | 'scheduled' | 'published'
  dueDate: string
  notes: string
}

type LegacyTask = {
  id: string
  title: string
  related: string
  due: string
  done: boolean
}

function migrateLegacy(): { content: ContentItem[]; tasks: TaskItem[] } {
  const content: ContentItem[] = []
  const seen = new Set<string>()

  const legacyIdeas = readJson<LegacyIdea[]>('creatorhub_ideas') ?? []
  for (const idea of legacyIdeas) {
    if (!idea || typeof idea.id !== 'string' || seen.has(idea.id)) continue
    seen.add(idea.id)
    const status: ContentStatus =
      idea.status === 'In Progress'
        ? 'in-progress'
        : idea.status === 'Ready'
          ? 'in-review'
          : idea.status === 'Published'
            ? 'published'
            : 'idea'
    content.push({
      id: idea.id,
      title: idea.title ?? 'Untitled',
      description: idea.description ?? '',
      platform: idea.channel ?? 'Other',
      format: idea.format ?? '',
      topic: idea.topic ?? '',
      tags: Array.isArray(idea.tags) ? idea.tags : [],
      status,
      plannedDate: null,
      createdAt: idea.createdAt ?? new Date().toISOString(),
      updatedAt: idea.updatedAt ?? new Date().toISOString(),
      deletedAt: idea.isDeleted ? (idea.deletedAt ?? new Date().toISOString()) : null,
    })
  }

  const legacyBoard = readJson<LegacyBoardItem[]>('creatorhub_board') ?? []
  for (const item of legacyBoard) {
    if (!item || typeof item.id !== 'string' || seen.has(item.id)) continue
    seen.add(item.id)
    const status: ContentStatus =
      item.status === 'scheduled'
        ? 'planned'
        : item.status === 'review'
          ? 'in-review'
          : item.status === 'published'
            ? 'published'
            : 'idea'
    content.push({
      id: item.id,
      title: item.title ?? 'Untitled',
      description: item.notes ?? '',
      platform: item.channel ?? 'Other',
      format: item.format ?? '',
      topic: '',
      tags: [],
      status,
      plannedDate: item.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    })
  }

  const byTitle = new Map(content.map((c) => [c.title.toLowerCase(), c.id]))
  const legacyTasks = readJson<LegacyTask[]>('creatorhub_tasks') ?? []
  const tasks: TaskItem[] = []
  const seenTasks = new Set<string>()
  for (const task of legacyTasks) {
    if (!task || typeof task.id !== 'string' || seenTasks.has(task.id)) continue
    seenTasks.add(task.id)
    let dueDate: string | null = null
    if (task.due === 'Today') dueDate = toLocalDateString(new Date())
    else if (task.due === 'Tomorrow')
      dueDate = toLocalDateString(new Date(Date.now() + 86400000))
    else if (/^\d{4}-\d{2}-\d{2}$/.test(task.due ?? '')) dueDate = task.due
    tasks.push({
      id: task.id,
      title: task.title ?? 'Untitled task',
      done: Boolean(task.done),
      dueDate,
      contentId: byTitle.get((task.related ?? '').toLowerCase()) ?? null,
      notes: '',
      createdAt: new Date().toISOString(),
    })
  }

  return { content, tasks }
}

function loadInitial(): { content: ContentItem[]; tasks: TaskItem[] } {
  const storedContent = readJson<ContentItem[]>(CONTENT_KEY)
  const storedTasks = readJson<TaskItem[]>(TASKS_KEY)
  if (storedContent !== null || storedTasks !== null) {
    return {
      content: Array.isArray(storedContent) ? storedContent : [],
      tasks: Array.isArray(storedTasks) ? storedTasks : [],
    }
  }
  if (window.localStorage.getItem(MIGRATED_KEY)) {
    return { content: [], tasks: [] }
  }
  const migrated = migrateLegacy()
  window.localStorage.setItem(MIGRATED_KEY, '1')
  return migrated
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [content, setContent] = useState<ContentItem[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])

  // Load from localStorage after mount (client-only; avoids SSR mismatch).
  useEffect(() => {
    const initial = loadInitial()
    setContent(initial.content)
    setTasks(initial.tasks)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(CONTENT_KEY, JSON.stringify(content))
    } catch (e) {
      console.error('Error saving content to localStorage', e)
    }
  }, [content, hydrated])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
    } catch (e) {
      console.error('Error saving tasks to localStorage', e)
    }
  }, [tasks, hydrated])

  const addContent: StoreContextValue['addContent'] = (data) => {
    const now = new Date().toISOString()
    const item: ContentItem = {
      ...data,
      id: `c_${generateId()}`,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
    setContent((prev) => [item, ...prev])
    return item
  }

  const updateContent: StoreContextValue['updateContent'] = (id, updates) => {
    setContent((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }

  const setContentStatus: StoreContextValue['setContentStatus'] = (id, status) => {
    setContent((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              // Unscheduling when moving back to a bare idea
              plannedDate: status === 'idea' ? null : item.plannedDate,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
  }

  const scheduleContent: StoreContextValue['scheduleContent'] = (id, date) => {
    setContent((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        // Scheduling moves an idea forward; later-stage items keep their stage.
        const status: ContentStatus = item.status === 'idea' ? 'planned' : item.status
        return { ...item, plannedDate: date, status, updatedAt: new Date().toISOString() }
      }),
    )
  }

  const deleteContent: StoreContextValue['deleteContent'] = (id) => {
    setContent((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }

  const restoreContent: StoreContextValue['restoreContent'] = (id) => {
    setContent((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, deletedAt: null, updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }

  const permanentlyDeleteContent: StoreContextValue['permanentlyDeleteContent'] = (id) => {
    setContent((prev) => prev.filter((item) => item.id !== id))
    // Orphaned tasks keep existing but lose the link
    setTasks((prev) =>
      prev.map((t) => (t.contentId === id ? { ...t, contentId: null } : t)),
    )
  }

  const addTask: StoreContextValue['addTask'] = (data) => {
    const task: TaskItem = {
      ...data,
      done: data.done ?? false,
      id: `t_${generateId()}`,
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [task, ...prev])
  }

  const updateTask: StoreContextValue['updateTask'] = (id, updates) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task)),
    )
  }

  const toggleTask: StoreContextValue['toggleTask'] = (id) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    )
  }

  const deleteTask: StoreContextValue['deleteTask'] = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const value: StoreContextValue = {
    hydrated,
    content,
    addContent,
    updateContent,
    setContentStatus,
    scheduleContent,
    deleteContent,
    restoreContent,
    permanentlyDeleteContent,
    tasks,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
