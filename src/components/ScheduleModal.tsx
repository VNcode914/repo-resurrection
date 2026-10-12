import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/studio/Button";
import { ChannelDot } from "@/components/studio/ChannelDot";
import { useStore } from "@/lib/studio/store";
import { useStudio } from "@/lib/studio/studio-context";
import { formatDateLabel } from "@/lib/studio/types";

type Props = {
  date: string; // YYYY-MM-DD
  onClose: () => void;
  onCreateNew: () => void;
};

/** Pick an existing saved idea/content item and assign it to a date. */
export function ScheduleModal({ date, onClose, onCreateNew }: Props) {
  const { content, scheduleContent } = useStore();
  const { setNotice } = useStudio();
  const [selectedId, setSelectedId] = useState("");

  const candidates = content.filter((c) => !c.deletedAt);
  const selected = candidates.find((c) => c.id === selectedId);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    scheduleContent(selected.id, date);
    setNotice(`"${selected.title}" scheduled for ${formatDateLabel(date)}.`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="mobile-overlay" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-dialog-title"
        className="enter relative z-50 max-h-[90svh] w-full max-w-[480px] overflow-y-auto rounded-[24px] bg-ivory p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 id="schedule-dialog-title" className="font-display text-xl font-semibold">
              Add content
            </h2>
            <p className="mt-0.5 text-sm text-muted">{formatDateLabel(date)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-[10px] p-2 text-muted hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        {candidates.length === 0 ? (
          <div className="empty-state">
            <p className="font-display text-lg text-ink">No saved ideas yet</p>
            <p className="mt-2 text-sm text-muted">
              Create a new idea and it will be scheduled to this date.
            </p>
            <Button className="mt-4" onClick={onCreateNew}>
              Create new idea
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <fieldset>
              <legend className="field-label">Choose an existing idea or content item</legend>
              <ul className="mt-2 flex max-h-64 flex-col gap-2 overflow-y-auto">
                {candidates.map((c) => (
                  <li key={c.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-[12px] border px-3 py-2.5 transition-colors ${
                        selectedId === c.id
                          ? "border-copper bg-copper/5"
                          : "border-ink/10 hover:bg-paper"
                      }`}
                    >
                      <input
                        type="radio"
                        name="schedule-item"
                        value={c.id}
                        checked={selectedId === c.id}
                        onChange={() => setSelectedId(c.id)}
                        className="accent-copper"
                      />
                      <ChannelDot channel={c.platform} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{c.title}</span>
                        <span className="block text-xs text-muted">
                          {c.platform}
                          {c.format ? ` · ${c.format}` : ""}
                          {c.plannedDate ? ` · currently ${formatDateLabel(c.plannedDate)}` : ""}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
              <Button variant="ghost" onClick={onCreateNew}>
                Create new idea instead
              </Button>
              <Button type="submit" variant="primary" disabled={!selected}>
                Schedule
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
