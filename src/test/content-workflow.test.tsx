import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { StoreProvider, useStore } from "@/lib/studio/store";
import { todayString, type ContentItem, type TaskItem } from "@/lib/studio/types";

function Probe() {
  const store = useStore();
  return (
    <div>
      <span data-testid="hydrated">{String(store.hydrated)}</span>
      <span data-testid="content">{JSON.stringify(store.content)}</span>
      <span data-testid="tasks">{JSON.stringify(store.tasks)}</span>
      <button
        data-testid="add-idea"
        onClick={() =>
          store.addContent({
            title: "Test video",
            description: "",
            platform: "YouTube",
            format: "Video",
            topic: "",
            tags: [],
            status: "idea",
            plannedDate: null,
          })
        }
      />
      <button
        data-testid="schedule"
        onClick={() => {
          const first = store.content[0];
          if (first) store.scheduleContent(first.id, todayString());
        }}
      />
      <button
        data-testid="add-task"
        onClick={() => {
          const first = store.content[0];
          store.addTask({
            title: "Record it",
            dueDate: todayString(),
            contentId: first?.id ?? null,
            notes: "",
          });
        }}
      />
      <button
        data-testid="toggle-task"
        onClick={() => {
          const first = store.tasks[0];
          if (first) store.toggleTask(first.id);
        }}
      />
    </div>
  );
}

function readContent(): ContentItem[] {
  return JSON.parse(screen.getByTestId("content").textContent ?? "[]");
}

function readTasks(): TaskItem[] {
  return JSON.parse(screen.getByTestId("tasks").textContent ?? "[]");
}

describe("CreatorHub content workflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty with no hardcoded demo content", async () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("hydrated").textContent).toBe("true"),
    );
    expect(readContent()).toHaveLength(0);
    expect(readTasks()).toHaveLength(0);
  });

  it("scheduling an idea updates the same record to planned, never published", async () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("hydrated").textContent).toBe("true"),
    );

    act(() => screen.getByTestId("add-idea").click());
    expect(readContent()).toHaveLength(1);
    expect(readContent()[0].status).toBe("idea");

    act(() => screen.getByTestId("schedule").click());
    const after = readContent();
    expect(after).toHaveLength(1); // same record, no duplicate
    expect(after[0].status).toBe("planned");
    expect(after[0].plannedDate).toBe(todayString());
    expect(after[0].status).not.toBe("published");
  });

  it("completing a task never marks its content as published", async () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("hydrated").textContent).toBe("true"),
    );

    act(() => screen.getByTestId("add-idea").click());
    act(() => screen.getByTestId("schedule").click());
    act(() => screen.getByTestId("add-task").click());
    act(() => screen.getByTestId("toggle-task").click());

    expect(readTasks()[0].done).toBe(true);
    expect(readContent()[0].status).toBe("planned");
  });

  it("migrates legacy ideas, board items, and tasks without duplicates", async () => {
    window.localStorage.setItem(
      "creatorhub_ideas",
      JSON.stringify([
        {
          id: "i1",
          title: "Old idea",
          description: "desc",
          channel: "YouTube",
          format: "Video",
          topic: "",
          tags: [],
          status: "Inbox",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]),
    );
    window.localStorage.setItem(
      "creatorhub_board",
      JSON.stringify([
        {
          id: "c1",
          title: "Old scheduled post",
          format: "Video",
          channel: "YouTube",
          status: "scheduled",
          dueLabel: "Tue",
          dueDate: "2026-10-14",
          projectId: "p1",
          notes: "notes",
        },
      ]),
    );
    window.localStorage.setItem(
      "creatorhub_tasks",
      JSON.stringify([
        { id: "t1", title: "Old task", related: "Old scheduled post", due: "Today", done: false },
      ]),
    );

    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("hydrated").textContent).toBe("true"),
    );

    const content = readContent();
    expect(content).toHaveLength(2);
    expect(content.map((c) => c.id).sort()).toEqual(["c1", "i1"]);
    const scheduled = content.find((c) => c.id === "c1");
    expect(scheduled?.status).toBe("planned");
    expect(scheduled?.plannedDate).toBe("2026-10-14");

    const tasks = readTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].contentId).toBe("c1");
    expect(tasks[0].dueDate).toBe(todayString());
  });
});
