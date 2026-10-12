export type Platform = "YouTube" | "Instagram" | "X" | "LinkedIn" | "Blogs" | "TikTok" | "Other";

export type ContentStatus = "idea" | "planned" | "in-progress" | "in-review" | "published";

export type ContentItem = {
  id: string;
  title: string;
  description: string;
  platform: Platform;
  format: string;
  topic: string;
  tags: string[];
  status: ContentStatus;
  plannedDate: string | null; // local YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type TaskItem = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null; // local YYYY-MM-DD
  contentId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export const PLATFORMS: Platform[] = [
  "YouTube",
  "Instagram",
  "X",
  "LinkedIn",
  "Blogs",
  "TikTok",
  "Other",
];

export const STATUS_ORDER: ContentStatus[] = [
  "idea",
  "planned",
  "in-progress",
  "in-review",
  "published",
];

export const statusCopy: Record<ContentStatus, string> = {
  idea: "Idea",
  planned: "Planned",
  "in-progress": "In Progress",
  "in-review": "In Review",
  published: "Published",
};

export const platformFormats: Record<Platform, string[]> = {
  YouTube: ["Video", "Short", "Tutorial"],
  Instagram: ["Reel", "Carousel", "Story"],
  X: ["Post", "Thread"],
  LinkedIn: ["Professional post"],
  Blogs: ["Article", "Guide"],
  TikTok: ["Short video"],
  Other: ["Other"],
};

export const creator = {
  name: "Avery Sen",
  role: "Student creator",
  handle: "@averysen",
  studio: "Evening studio",
};

export const navItems = [
  { id: "studio", label: "Home", to: "/" },
  { id: "ideas", label: "Ideas", to: "/ideas" },
  { id: "calendar", label: "Calendar", to: "/calendar" },
  { id: "tasks", label: "Tasks", to: "/tasks" },
  { id: "analytics", label: "Insights", to: "/insights" },
  { id: "ai", label: "AI Companion", to: "/ai" },
  { id: "bin", label: "Recently Deleted", to: "/bin" },
  { id: "settings", label: "Settings", to: "/settings" },
] as const;

/** Local-calendar YYYY-MM-DD (avoids UTC timezone shifts). */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayString(): string {
  return toLocalDateString(new Date());
}

export function formatDateLabel(dateStr: string | null): string {
  if (!dateStr) return "Not scheduled";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== (m ?? 1) - 1 ||
    date.getDate() !== d
  ) {
    return "Invalid date";
  }
  const today = todayString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toLocalDateString(tomorrowDate);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const label = `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  if (dateStr === today) return `Today · ${label}`;
  if (dateStr === tomorrow) return `Tomorrow · ${label}`;
  return label;
}
