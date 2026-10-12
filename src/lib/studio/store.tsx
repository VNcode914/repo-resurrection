import {
  useCallback,
  createContext,
  useContext,
  useMemo,
  useRef,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toLocalDateString, type ContentItem, type ContentStatus, type TaskItem } from "./types";

const CONTENT_KEY = "creatorhub_content_v2";
const TASKS_KEY = "creatorhub_tasks_v2";
const MIGRATED_KEY = "creatorhub_migrated_v2";

type StoreContextValue = {
  hydrated: boolean;
  storageError: string | null;
  clearAllData: () => void;
  content: ContentItem[];
  addContent: (
    data: Omit<ContentItem, "id" | "createdAt" | "updatedAt" | "deletedAt">,
  ) => ContentItem;
  updateContent: (id: string, updates: Partial<ContentItem>) => void;
  setContentStatus: (id: string, status: ContentStatus) => void;
  scheduleContent: (id: string, date: string) => void;
  deleteContent: (id: string) => void; // soft delete
  restoreContent: (id: string) => void;
  permanentlyDeleteContent: (id: string) => void;

  tasks: TaskItem[];
  addTask: (
    data: Omit<TaskItem, "id" | "createdAt" | "updatedAt" | "done"> & { done?: boolean },
  ) => void;
  updateTask: (id: string, updates: Partial<TaskItem>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return ctx;
}

const generateId = () => `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;

type StoredRead = {
  exists: boolean;
  value: unknown;
  warning?: string;
  blocked: boolean;
};

function readJson(key: string): StoredRead {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return {
      exists: false,
      value: null,
      warning: "Browser storage is unavailable. Changes may not persist after closing this tab.",
      blocked: true,
    };
  }

  if (raw === null) return { exists: false, value: null, blocked: false };

  try {
    return { exists: true, value: JSON.parse(raw) as unknown, blocked: false };
  } catch {
    try {
      const backupKey = `${key}_recovery_${Date.now()}`;
      if (window.localStorage.getItem(backupKey) === null) {
        window.localStorage.setItem(backupKey, raw);
      }
      return {
        exists: true,
        value: null,
        warning: `Unreadable saved data was preserved in browser storage (${backupKey}) before recovery.`,
        blocked: false,
      };
    } catch {
      return {
        exists: true,
        value: null,
        warning:
          "Saved data could not be read or backed up. Changes will not overwrite the unreadable data.",
        blocked: true,
      };
    }
  }
}

function backupInvalidRecords(key: string, rawValue: unknown): boolean {
  try {
    const backupKey = `${key}_recovery_${Date.now()}`;
    if (window.localStorage.getItem(backupKey) === null) {
      window.localStorage.setItem(backupKey, JSON.stringify(rawValue));
    }
    return true;
  } catch {
    return false;
  }
}

function isLocalDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  return (
    date.getFullYear() === year && date.getMonth() === (month ?? 1) - 1 && date.getDate() === day
  );
}

function hasInvalidStoredDate(value: unknown, key: "plannedDate" | "dueDate"): boolean {
  if (!value || typeof value !== "object") return false;
  const date = (value as Record<string, unknown>)[key];
  return date !== undefined && date !== null && !isLocalDate(date);
}

function normalizeContent(value: unknown): ContentItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<ContentItem>;
  if (typeof item.id !== "string" || !item.id.trim()) return null;

  const now = new Date().toISOString();
  const createdAt = typeof item.createdAt === "string" ? item.createdAt : now;
  const validStatuses: ContentStatus[] = [
    "idea",
    "planned",
    "in-progress",
    "in-review",
    "published",
  ];
  const platforms: ContentItem["platform"][] = [
    "YouTube",
    "Instagram",
    "X",
    "LinkedIn",
    "Blogs",
    "TikTok",
    "Other",
  ];

  return {
    id: item.id,
    title: typeof item.title === "string" ? item.title : "Untitled",
    description: typeof item.description === "string" ? item.description : "",
    platform: platforms.includes(item.platform as ContentItem["platform"])
      ? (item.platform as ContentItem["platform"])
      : "Other",
    format: typeof item.format === "string" ? item.format : "",
    topic: typeof item.topic === "string" ? item.topic : "",
    tags: Array.isArray(item.tags)
      ? item.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    status: validStatuses.includes(item.status as ContentStatus)
      ? (item.status as ContentStatus)
      : "idea",
    plannedDate: isLocalDate(item.plannedDate) ? item.plannedDate : null,
    createdAt,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : createdAt,
    deletedAt: typeof item.deletedAt === "string" ? item.deletedAt : null,
  };
}

function normalizeTask(value: unknown): TaskItem | null {
  if (!value || typeof value !== "object") return null;
  const task = value as Partial<TaskItem>;
  if (typeof task.id !== "string" || !task.id.trim()) return null;

  const now = new Date().toISOString();
  const createdAt = typeof task.createdAt === "string" ? task.createdAt : now;
  return {
    id: task.id,
    title: typeof task.title === "string" ? task.title : "Untitled task",
    done: Boolean(task.done),
    dueDate: isLocalDate(task.dueDate) ? task.dueDate : null,
    contentId: typeof task.contentId === "string" ? task.contentId : null,
    notes: typeof task.notes === "string" ? task.notes : "",
    createdAt,
    updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : createdAt,
  };
}

function uniqueById<T extends { id: string }>(items: T[]): { items: T[]; duplicateCount: number } {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return { items: unique, duplicateCount: items.length - unique.length };
}

/* ---------- Legacy migration (creatorhub_ideas / creatorhub_board / creatorhub_tasks) ---------- */

type LegacyIdea = {
  id: string;
  title: string;
  description: string;
  channel: ContentItem["platform"];
  format: string;
  topic: string;
  tags: string[];
  status: "Inbox" | "In Progress" | "Ready" | "Published";
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
};

type LegacyBoardItem = {
  id: string;
  title: string;
  format: string;
  channel: ContentItem["platform"];
  status: "draft" | "review" | "scheduled" | "published";
  dueDate: string;
  notes: string;
};

type LegacyTask = {
  id: string;
  title: string;
  related: string;
  due: string;
  done: boolean;
};

function migrateLegacy(warnings: string[]): { content: ContentItem[]; tasks: TaskItem[] } {
  const content: ContentItem[] = [];
  const seen = new Set<string>();

  const ideasRead = readJson("creatorhub_ideas");
  const boardRead = readJson("creatorhub_board");
  const tasksRead = readJson("creatorhub_tasks");
  for (const read of [ideasRead, boardRead, tasksRead]) {
    if (read.warning) warnings.push(read.warning);
  }

  const legacyIdeas = Array.isArray(ideasRead.value) ? (ideasRead.value as LegacyIdea[]) : [];
  for (const idea of legacyIdeas) {
    if (!idea || typeof idea.id !== "string" || seen.has(idea.id)) continue;
    seen.add(idea.id);
    const status: ContentStatus =
      idea.status === "In Progress"
        ? "in-progress"
        : idea.status === "Ready"
          ? "in-review"
          : idea.status === "Published"
            ? "published"
            : "idea";
    content.push({
      id: idea.id,
      title: idea.title ?? "Untitled",
      description: idea.description ?? "",
      platform: idea.channel ?? "Other",
      format: idea.format ?? "",
      topic: idea.topic ?? "",
      tags: Array.isArray(idea.tags) ? idea.tags : [],
      status,
      plannedDate: null,
      createdAt: idea.createdAt ?? new Date().toISOString(),
      updatedAt: idea.updatedAt ?? new Date().toISOString(),
      deletedAt: idea.isDeleted ? (idea.deletedAt ?? new Date().toISOString()) : null,
    });
  }

  const legacyBoard = Array.isArray(boardRead.value) ? (boardRead.value as LegacyBoardItem[]) : [];
  for (const item of legacyBoard) {
    if (!item || typeof item.id !== "string") continue;
    const existing = content.find((candidate) => candidate.id === item.id);
    if (existing) {
      if (item.dueDate && isLocalDate(item.dueDate)) {
        existing.plannedDate = item.dueDate;
        if (existing.status === "idea") existing.status = "planned";
      }
      if (item.status === "published") existing.status = "published";
      else if (item.status === "review" && existing.status !== "published")
        existing.status = "in-review";
      continue;
    }
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const status: ContentStatus =
      item.status === "scheduled"
        ? "planned"
        : item.status === "review"
          ? "in-review"
          : item.status === "published"
            ? "published"
            : "idea";
    content.push({
      id: item.id,
      title: item.title ?? "Untitled",
      description: item.notes ?? "",
      platform: item.channel ?? "Other",
      format: item.format ?? "",
      topic: "",
      tags: [],
      status,
      plannedDate: isLocalDate(item.dueDate) ? item.dueDate : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });
  }

  const byTitle = new Map<string, string | null>();
  for (const item of content) {
    const title = item.title.toLowerCase();
    byTitle.set(title, byTitle.has(title) ? null : item.id);
  }
  const legacyTasks = Array.isArray(tasksRead.value) ? (tasksRead.value as LegacyTask[]) : [];
  const tasks: TaskItem[] = [];
  const seenTasks = new Set<string>();
  for (const task of legacyTasks) {
    if (!task || typeof task.id !== "string" || seenTasks.has(task.id)) continue;
    seenTasks.add(task.id);
    let dueDate: string | null = null;
    if (task.due === "Today") dueDate = toLocalDateString(new Date());
    else if (task.due === "Tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDate = toLocalDateString(tomorrow);
    } else if (isLocalDate(task.due)) dueDate = task.due;
    const now = new Date().toISOString();
    tasks.push({
      id: task.id,
      title: task.title ?? "Untitled task",
      done: Boolean(task.done),
      dueDate,
      contentId: byTitle.get((task.related ?? "").toLowerCase()) ?? null,
      notes: "",
      createdAt: now,
      updatedAt: now,
    });
  }

  return { content, tasks };
}

function loadInitial(): {
  content: ContentItem[];
  tasks: TaskItem[];
  storageError: string | null;
  blockedContentWrite: boolean;
  blockedTaskWrite: boolean;
} {
  const warnings: string[] = [];
  const storedContent = readJson(CONTENT_KEY);
  const storedTasks = readJson(TASKS_KEY);
  const migratedFlag = readJson(MIGRATED_KEY);
  for (const read of [storedContent, storedTasks, migratedFlag]) {
    if (read.warning) warnings.push(read.warning);
  }

  let blockedContentWrite = storedContent.blocked;
  let blockedTaskWrite = storedTasks.blocked;
  if (storedContent.exists && !Array.isArray(storedContent.value)) {
    const backedUp = backupInvalidRecords(CONTENT_KEY, storedContent.value);
    warnings.push(
      backedUp
        ? "Unreadable content data was preserved in a recovery copy before recovery."
        : "Content data could not be backed up. Changes will not overwrite it.",
    );
    blockedContentWrite ||= !backedUp;
  }
  if (storedTasks.exists && !Array.isArray(storedTasks.value)) {
    const backedUp = backupInvalidRecords(TASKS_KEY, storedTasks.value);
    warnings.push(
      backedUp
        ? "Unreadable task data was preserved in a recovery copy before recovery."
        : "Task data could not be backed up. Changes will not overwrite it.",
    );
    blockedTaskWrite ||= !backedUp;
  }
  const storedContentRecords = Array.isArray(storedContent.value) ? storedContent.value : [];
  const storedTaskRecords = Array.isArray(storedTasks.value) ? storedTasks.value : [];
  const normalizedContent = storedContentRecords.map(normalizeContent);
  const normalizedTasks = storedTaskRecords.map(normalizeTask);
  const validContent = normalizedContent.filter((item): item is ContentItem => item !== null);
  const validTasks = normalizedTasks.filter((task): task is TaskItem => task !== null);
  const uniqueContent = uniqueById(validContent);
  const uniqueTasks = uniqueById(validTasks);
  const invalidContentCount =
    normalizedContent.filter((item) => item === null).length +
    uniqueContent.duplicateCount +
    storedContentRecords.filter((item) => hasInvalidStoredDate(item, "plannedDate")).length;
  const invalidTaskCount =
    normalizedTasks.filter((task) => task === null).length +
    uniqueTasks.duplicateCount +
    storedTaskRecords.filter((task) => hasInvalidStoredDate(task, "dueDate")).length;

  if (invalidContentCount > 0) {
    const backedUp = backupInvalidRecords(CONTENT_KEY, storedContentRecords);
    warnings.push(
      backedUp
        ? `${invalidContentCount} invalid or duplicate content record(s) were preserved in a recovery copy.`
        : "Some content records could not be read or backed up. Changes will not overwrite that data.",
    );
    blockedContentWrite ||= !backedUp;
  }
  if (invalidTaskCount > 0) {
    const backedUp = backupInvalidRecords(TASKS_KEY, storedTaskRecords);
    warnings.push(
      backedUp
        ? `${invalidTaskCount} invalid or duplicate task record(s) were preserved in a recovery copy.`
        : "Some task records could not be read or backed up. Changes will not overwrite that data.",
    );
    blockedTaskWrite ||= !backedUp;
  }

  const isMigrated = migratedFlag.value === "1";
  const migrated = isMigrated ? { content: [], tasks: [] } : migrateLegacy(warnings);
  const content = [...uniqueContent.items];
  const contentIds = new Set(content.map((item) => item.id));
  for (const item of migrated.content) {
    if (!contentIds.has(item.id)) {
      content.push(item);
      contentIds.add(item.id);
    }
  }
  const tasks = [...uniqueTasks.items];
  const taskIds = new Set(tasks.map((task) => task.id));
  for (const task of migrated.tasks) {
    if (!taskIds.has(task.id)) {
      tasks.push(task);
      taskIds.add(task.id);
    }
  }

  if (!isMigrated) {
    try {
      window.localStorage.setItem(MIGRATED_KEY, "1");
    } catch {
      warnings.push("Legacy data migration could not be recorded in browser storage.");
    }
  }

  return {
    content,
    tasks,
    storageError: warnings[0] ?? null,
    blockedContentWrite,
    blockedTaskWrite,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);
  const blockedWrites = useRef({ content: false, tasks: false });

  const reportStorageError = useCallback((message: string | null) => {
    setStorageError((current) => (current === message ? current : message));
  }, []);

  // Load from localStorage after mount (client-only; avoids SSR mismatch).
  useEffect(() => {
    try {
      const initial = loadInitial();
      blockedWrites.current = {
        content: initial.blockedContentWrite,
        tasks: initial.blockedTaskWrite,
      };
      setContent(initial.content);
      setTasks(initial.tasks);
      reportStorageError(initial.storageError);
    } catch {
      blockedWrites.current = { content: true, tasks: true };
      reportStorageError(
        "Browser storage could not be opened. Your changes will stay in this tab and may be lost when it closes.",
      );
    } finally {
      setHydrated(true);
    }
  }, [reportStorageError]);

  useEffect(() => {
    if (!hydrated || blockedWrites.current.content) return;
    try {
      const serialized = JSON.stringify(content);
      if (window.localStorage.getItem(CONTENT_KEY) !== serialized) {
        window.localStorage.setItem(CONTENT_KEY, serialized);
      }
    } catch {
      reportStorageError(
        "Content could not be saved to browser storage. Keep this tab open and try again.",
      );
    }
  }, [content, hydrated, reportStorageError]);

  useEffect(() => {
    if (!hydrated || blockedWrites.current.tasks) return;
    try {
      const serialized = JSON.stringify(tasks);
      if (window.localStorage.getItem(TASKS_KEY) !== serialized) {
        window.localStorage.setItem(TASKS_KEY, serialized);
      }
    } catch {
      reportStorageError(
        "Tasks could not be saved to browser storage. Keep this tab open and try again.",
      );
    }
  }, [tasks, hydrated, reportStorageError]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (!event.newValue) return;
      try {
        const parsed: unknown = JSON.parse(event.newValue);
        if (!Array.isArray(parsed)) return;
        if (event.key === CONTENT_KEY) {
          const next = parsed
            .map(normalizeContent)
            .filter((item): item is ContentItem => item !== null);
          setContent((previous) =>
            JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
          );
        } else if (event.key === TASKS_KEY) {
          const next = parsed.map(normalizeTask).filter((task): task is TaskItem => task !== null);
          setTasks((previous) =>
            JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
          );
        }
      } catch {
        reportStorageError("Updated data from another tab could not be read.");
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [reportStorageError]);

  const addContent = useCallback<StoreContextValue["addContent"]>((data) => {
    const now = new Date().toISOString();
    const item: ContentItem = {
      ...data,
      id: `c_${generateId()}`,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    setContent((prev) => [item, ...prev]);
    return item;
  }, []);

  const updateContent = useCallback<StoreContextValue["updateContent"]>((id, updates) => {
    setContent((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item,
      ),
    );
  }, []);

  const setContentStatus = useCallback<StoreContextValue["setContentStatus"]>((id, status) => {
    setContent((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              // Unscheduling when moving back to a bare idea
              plannedDate: status === "idea" ? null : item.plannedDate,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  }, []);

  const scheduleContent = useCallback<StoreContextValue["scheduleContent"]>(
    (id, date) => {
      if (!isLocalDate(date)) {
        reportStorageError("Choose a valid calendar date before scheduling content.");
        return;
      }
      setContent((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          // Scheduling moves an idea forward; later-stage items keep their stage.
          const status: ContentStatus = item.status === "idea" ? "planned" : item.status;
          return { ...item, plannedDate: date, status, updatedAt: new Date().toISOString() };
        }),
      );
    },
    [reportStorageError],
  );

  const deleteContent = useCallback<StoreContextValue["deleteContent"]>((id) => {
    setContent((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  }, []);

  const restoreContent = useCallback<StoreContextValue["restoreContent"]>((id) => {
    setContent((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, deletedAt: null, updatedAt: new Date().toISOString() } : item,
      ),
    );
  }, []);

  const permanentlyDeleteContent = useCallback<StoreContextValue["permanentlyDeleteContent"]>(
    (id) => {
      setContent((prev) => prev.filter((item) => item.id !== id));
      // Orphaned tasks keep existing but lose the link
      setTasks((prev) =>
        prev.map((task) =>
          task.contentId === id
            ? { ...task, contentId: null, updatedAt: new Date().toISOString() }
            : task,
        ),
      );
    },
    [],
  );

  const addTask = useCallback<StoreContextValue["addTask"]>((data) => {
    const now = new Date().toISOString();
    const task: TaskItem = {
      ...data,
      done: data.done ?? false,
      id: `t_${generateId()}`,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [task, ...prev]);
  }, []);

  const updateTask = useCallback<StoreContextValue["updateTask"]>((id, updates) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task,
      ),
    );
  }, []);

  const toggleTask = useCallback<StoreContextValue["toggleTask"]>((id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done, updatedAt: new Date().toISOString() } : task,
      ),
    );
  }, []);

  const deleteTask = useCallback<StoreContextValue["deleteTask"]>((id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const clearAllData = useCallback(() => {
    setContent([]);
    setTasks([]);
    try {
      window.localStorage.setItem(MIGRATED_KEY, "1");
      blockedWrites.current = { content: false, tasks: false };
      reportStorageError(null);
    } catch {
      reportStorageError(
        "Data was cleared from this tab but could not be updated in browser storage.",
      );
    }
  }, [reportStorageError]);

  const value = useMemo<StoreContextValue>(
    () => ({
      hydrated,
      storageError,
      clearAllData,
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
    }),
    [
      hydrated,
      storageError,
      clearAllData,
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
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
