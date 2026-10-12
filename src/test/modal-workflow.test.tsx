import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { ContentModal } from "@/components/ContentModal";
import { TaskModal } from "@/components/TaskModal";
import { StoreProvider, useStore } from "@/lib/studio/store";
import { StudioProvider } from "@/lib/studio/studio-context";
import {
  todayString,
  toLocalDateString,
  type ContentItem,
  type TaskItem,
} from "@/lib/studio/types";

function ContentModalHarness({ date }: { date: string }) {
  const { content, hydrated } = useStore();

  return (
    <>
      <span data-testid="hydrated">{String(hydrated)}</span>
      <span data-testid="content">{JSON.stringify(content)}</span>
      {hydrated ? <ContentModal item={null} defaultPlannedDate={date} onClose={() => {}} /> : null}
    </>
  );
}

function TaskModalHarness() {
  const { content, tasks, addContent, toggleTask, hydrated } = useStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!hydrated || content.length > 0) return;
    addContent({
      title: "Instagram Reel Test",
      description: "",
      platform: "Instagram",
      format: "Reel",
      topic: "",
      tags: [],
      status: "planned",
      plannedDate: null,
    });
  }, [addContent, content.length, hydrated]);

  return (
    <>
      <span data-testid="hydrated">{String(hydrated)}</span>
      <span data-testid="content">{JSON.stringify(content)}</span>
      <span data-testid="tasks">{JSON.stringify(tasks)}</span>
      <button type="button" onClick={() => setModalOpen(true)}>
        Open task form
      </button>
      {tasks.map((task) => (
        <button
          type="button"
          key={task.id}
          aria-label={`${task.done ? "Mark incomplete" : "Complete"}: ${task.title}`}
          onClick={() => toggleTask(task.id)}
        />
      ))}
      {hydrated && modalOpen ? (
        <TaskModal
          task={null}
          defaultContentId={content[0]?.id ?? null}
          defaultDueDate={todayString()}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
}

function parseJson<T>(testId: string): T {
  return JSON.parse(screen.getByTestId(testId).textContent ?? "null") as T;
}

function futureDate() {
  const date = new Date();
  date.setDate(date.getDate() + 8);
  return toLocalDateString(date);
}

describe("CreatorHub content and task forms", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates a single planned content record from a calendar date", async () => {
    const date = futureDate();
    render(
      <StoreProvider>
        <StudioProvider>
          <ContentModalHarness date={date} />
        </StudioProvider>
      </StoreProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "  Instagram Reel Test  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save idea" }));

    await waitFor(() => {
      const content = parseJson<ContentItem[]>("content");
      expect(content).toHaveLength(1);
      expect(content[0]).toMatchObject({
        title: "Instagram Reel Test",
        status: "planned",
        plannedDate: date,
      });
    });
  });

  it("requires a local date before saving content as planned", async () => {
    render(
      <StoreProvider>
        <StudioProvider>
          <ContentModalHarness date="" />
        </StudioProvider>
      </StoreProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Unscheduled draft" },
    });
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "planned" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save idea" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose a date for planned content.",
    );
    expect(parseJson<ContentItem[]>("content")).toHaveLength(0);
  });

  it("links today’s task to the selected content and keeps publishing explicit", async () => {
    render(
      <StoreProvider>
        <StudioProvider>
          <TaskModalHarness />
        </StudioProvider>
      </StoreProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));
    await waitFor(() => expect(parseJson<ContentItem[]>("content")).toHaveLength(1));
    fireEvent.click(screen.getByRole("button", { name: "Open task form" }));
    fireEvent.change(screen.getByLabelText("Task"), {
      target: { value: "Write Reel Caption" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() => {
      const tasks = parseJson<TaskItem[]>("tasks");
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        title: "Write Reel Caption",
        dueDate: todayString(),
        contentId: parseJson<ContentItem[]>("content")[0]?.id,
        done: false,
      });
      expect(tasks[0]?.updatedAt).toBeTruthy();
    });

    const task = parseJson<TaskItem[]>("tasks")[0];
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: `Complete: ${task?.title}` }));
    });
    expect(parseJson<TaskItem[]>("tasks")[0]?.done).toBe(true);
    expect(parseJson<ContentItem[]>("content")[0]?.status).toBe("planned");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: `Mark incomplete: ${task?.title}` }));
    });
    expect(parseJson<TaskItem[]>("tasks")[0]?.done).toBe(false);
  });
});
