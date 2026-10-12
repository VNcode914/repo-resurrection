import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/studio/Button";
import { useStore } from "@/lib/studio/store";
import { useStudio } from "@/lib/studio/studio-context";
import {
  PLATFORMS,
  STATUS_ORDER,
  platformFormats,
  statusCopy,
  type ContentItem,
  type ContentStatus,
  type Platform,
} from "@/lib/studio/types";

type Props = {
  item: ContentItem | null;
  defaultPlannedDate?: string | null;
  onClose: () => void;
};

export function ContentModal({ item, defaultPlannedDate, onClose }: Props) {
  const { addContent, updateContent } = useStore();
  const { setNotice } = useStudio();

  const [title, setTitle] = useState(item?.title ?? "");
  const [titleError, setTitleError] = useState("");
  const [dateError, setDateError] = useState("");
  const [description, setDescription] = useState(item?.description ?? "");
  const [platform, setPlatform] = useState<Platform>(item?.platform ?? "YouTube");
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? "idea");
  const [format, setFormat] = useState(item?.format ?? platformFormats["YouTube"][0] ?? "Other");
  const [topic, setTopic] = useState(item?.topic ?? "");
  const [tags, setTags] = useState(item?.tags.join(", ") ?? "");
  const [plannedDate, setPlannedDate] = useState(item?.plannedDate ?? defaultPlannedDate ?? "");

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
      setTitleError("Add a title before saving.");
      return;
    }
    setTitleError("");
    if (status === "planned" && !plannedDate) {
      setDateError("Choose a date for planned content.");
      return;
    }
    setDateError("");
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const data = {
      title: trimmedTitle,
      description,
      platform,
      status: status === "idea" && plannedDate ? "planned" : status,
      format: format || "Other",
      topic,
      tags: parsedTags,
      plannedDate: plannedDate || null,
    };

    if (item) {
      updateContent(item.id, data);
      setNotice("Content updated.");
    } else {
      addContent(data);
      setNotice("Idea saved.");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="mobile-overlay" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-dialog-title"
        className="enter relative z-50 max-h-[90svh] w-full max-w-[520px] overflow-y-auto rounded-[24px] bg-ivory p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4">
          <h2 id="content-dialog-title" className="font-display text-xl font-semibold">
            {item ? "Edit content" : "Capture idea"}
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
            <label htmlFor="content-title" className="field-label">
              Title
            </label>
            <input
              id="content-title"
              required
              autoFocus
              value={title}
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? "content-title-error" : undefined}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setTitleError("");
              }}
              className="field-input"
              placeholder="e.g. My new setup..."
            />
            {titleError ? (
              <p id="content-title-error" role="alert" className="mt-1 text-sm text-red-700">
                {titleError}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="content-description" className="field-label">
              Description / notes
            </label>
            <textarea
              id="content-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field-input resize-none"
              placeholder="Jot down the angle, outline, or key points..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="content-platform" className="field-label">
                Platform
              </label>
              <select
                id="content-platform"
                value={platform}
                onChange={(e) => {
                  const next = e.target.value as Platform;
                  setPlatform(next);
                  setFormat(platformFormats[next][0] ?? "Other");
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
              <label htmlFor="content-status" className="field-label">
                Status
              </label>
              <select
                id="content-status"
                value={status}
                onChange={(e) => {
                  const nextStatus = e.target.value as ContentStatus;
                  setStatus(nextStatus);
                  if (nextStatus !== "planned" || plannedDate) setDateError("");
                }}
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
              <label htmlFor="content-format" className="field-label">
                Format
              </label>
              <select
                id="content-format"
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
              <label htmlFor="content-planned-date" className="field-label">
                Planned date
              </label>
              <input
                id="content-planned-date"
                type="date"
                value={plannedDate}
                aria-invalid={Boolean(dateError)}
                aria-describedby={dateError ? "content-date-error" : undefined}
                onChange={(e) => {
                  setPlannedDate(e.target.value);
                  if (e.target.value) setDateError("");
                }}
                className="field-input"
              />
              {dateError ? (
                <p id="content-date-error" role="alert" className="mt-1 text-sm text-red-700">
                  {dateError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="content-topic" className="field-label">
                Topic
              </label>
              <input
                id="content-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="field-input"
                placeholder="e.g. Design"
              />
            </div>
            <div>
              <label htmlFor="content-tags" className="field-label">
                Tags
              </label>
              <input
                id="content-tags"
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
              {item ? "Save changes" : "Save idea"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
