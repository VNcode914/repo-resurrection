import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/studio/Button";
import { useStore } from "@/lib/studio/store";
import { useStudio } from "@/lib/studio/studio-context";
import type { TaskItem } from "@/lib/studio/types";

type Props = {
  task: TaskItem | null;
  defaultContentId?: string | null;
  defaultDueDate?: string | null;
  onClose: () => void;
};

export function TaskModal({ task, defaultContentId, defaultDueDate, onClose }: Props) {
  const { content, addTask, updateTask } = useStore();
  const { setNotice } = useStudio();

  const [title, setTitle] = useState(task?.title ?? "");
  const [titleError, setTitleError] = useState("");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDueDate ?? "");
  const [contentId, setContentId] = useState(task?.contentId ?? defaultContentId ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");

  const linkedDeletedContent = task?.contentId
    ? content.filter((item) => item.id === task.contentId && item.deletedAt)
    : [];
  const availableContent = [...content.filter((item) => !item.deletedAt), ...linkedDeletedContent];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Add a task title before saving.");
      return;
    }
    setTitleError("");
    const data = {
      title: trimmedTitle,
      dueDate: dueDate || null,
      contentId: contentId || null,
      notes,
    };
    if (task) {
      updateTask(task.id, data);
      setNotice("Task updated.");
    } else {
      addTask(data);
      setNotice("Task added.");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="mobile-overlay" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-dialog-title"
        className="enter relative z-50 max-h-[90svh] w-full max-w-[480px] overflow-y-auto rounded-[24px] bg-ivory p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4">
          <h2 id="task-dialog-title" className="font-display text-xl font-semibold">
            {task ? "Edit task" : "New task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-[10px] p-2 text-muted hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="task-title" className="field-label">
              Task
            </label>
            <input
              id="task-title"
              required
              autoFocus
              value={title}
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? "task-title-error" : undefined}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setTitleError("");
              }}
              className="field-input"
              placeholder="e.g. Record the video"
            />
            {titleError ? (
              <p id="task-title-error" role="alert" className="mt-1 text-sm text-red-700">
                {titleError}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-due-date" className="field-label">
                Due date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="task-content" className="field-label">
                Linked content
              </label>
              <select
                id="task-content"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
                className="field-input"
              >
                <option value="">None</option>
                {availableContent.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                    {c.deletedAt ? " (Recently deleted)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="task-notes" className="field-label">
              Notes (optional)
            </label>
            <textarea
              id="task-notes"
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
              {task ? "Save changes" : "Add task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
