import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { StoreProvider, useStore } from "@/lib/studio/store";
import {
  todayString,
  toLocalDateString,
  type ContentItem,
  type TaskItem,
} from "@/lib/studio/types";

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
        data-testid="schedule-future"
        onClick={() => {
          const first = store.content[0];
          const future = new Date();
          future.setDate(future.getDate() + 8);
          if (first) store.scheduleContent(first.id, toLocalDateString(future));
        }}
      />
      <button
        data-testid="edit-content"
        onClick={() => {
          const first = store.content[0];
          if (first)
            store.updateContent(first.id, { title: "Instagram Reel Test", status: "in-review" });
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
      <button
        data-testid="soft-delete-content"
        onClick={() => {
          const first = store.content[0];
          if (first) store.deleteContent(first.id);
        }}
      />
      <button
        data-testid="restore-content"
        onClick={() => {
          const first = store.content[0];
          if (first) store.restoreContent(first.id);
        }}
      />
      <button
        data-testid="permanently-delete-content"
        onClick={() => {
          const first = store.content[0];
          if (first) store.permanentlyDeleteContent(first.id);
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
    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));
    expect(readContent()).toHaveLength(0);
    expect(readTasks()).toHaveLength(0);
  });

  it("scheduling an idea updates the same record to planned, never published", async () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));

    act(() => screen.getByTestId("add-idea").click());
    expect(readContent()).toHaveLength(1);
    expect(readContent()[0]!.status).toBe("idea");

    act(() => screen.getByTestId("schedule").click());
    const after = readContent();
    expect(after).toHaveLength(1); // same record, no duplicate
    expect(after[0]!.status).toBe("planned");
    expect(after[0]!.plannedDate).toBe(todayString());
    expect(after[0]!.status).not.toBe("published");
  });

  it("completing a task never marks its content as published", async () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));

    act(() => screen.getByTestId("add-idea").click());
    act(() => screen.getByTestId("schedule").click());
    act(() => screen.getByTestId("add-task").click());
    act(() => screen.getByTestId("toggle-task").click());

    expect(readTasks()[0]!.done).toBe(true);
    expect(readContent()[0]!.status).toBe("planned");
  });

  it("preserves linked tasks on soft delete and unlinks them on permanent delete", async () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("hydrated").textContent).toBe("true"),
    );

    act(() => screen.getByTestId("add-idea").click());
    act(() => screen.getByTestId("add-task").click());
    const contentId = readContent()[0]!.id;
    expect(readTasks()[0]!.contentId).toBe(contentId);

    act(() => screen.getByTestId("soft-delete-content").click());
    expect(readContent()[0]!.deletedAt).toBeTruthy();
    expect(readTasks()[0]!.contentId).toBe(contentId);

    act(() => screen.getByTestId("restore-content").click());
    expect(readContent()[0]!.deletedAt).toBe(null);
    expect(readTasks()[0]!.contentId).toBe(contentId);

    act(() => screen.getByTestId("permanently-delete-content").click());
    expect(readContent()).toHaveLength(0);
    expect(readTasks()).toHaveLength(1);
    expect(readTasks()[0]!.contentId).toBe(null);
  });

  it("keeps scheduled content and linked task IDs after remounting the store", async () => {
    const firstRender = render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));

    act(() => screen.getByTestId("add-idea").click());
    const firstContent = readContent()[0]!;
    act(() => {
      screen.getByTestId("schedule-future").click();
      screen.getByTestId("edit-content").click();
      screen.getByTestId("add-task").click();
    });

    const expectedFuture = new Date();
    expectedFuture.setDate(expectedFuture.getDate() + 8);
    const futureDate = toLocalDateString(expectedFuture);
    await waitFor(() => expect(readTasks()).toHaveLength(1));
    expect(readContent()).toHaveLength(1);
    expect(readContent()[0]).toMatchObject({
      id: firstContent.id,
      title: "Instagram Reel Test",
      status: "in-review",
      plannedDate: futureDate,
    });
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem("creatorhub_content_v2") ?? "[]")).toHaveLength(
        1,
      );
      expect(JSON.parse(window.localStorage.getItem("creatorhub_tasks_v2") ?? "[]")).toHaveLength(
        1,
      );
    });
    const storedContent = JSON.parse(
      window.localStorage.getItem("creatorhub_content_v2") ?? "[]",
    ) as ContentItem[];
    const storedTasks = JSON.parse(
      window.localStorage.getItem("creatorhub_tasks_v2") ?? "[]",
    ) as TaskItem[];
    firstRender.unmount();

    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));
    expect(readContent()[0]?.id).toBe(storedContent[0]?.id);
    expect(readContent()).toHaveLength(1);
    expect(readTasks()[0]?.id).toBe(storedTasks[0]?.id);
    expect(readTasks()[0]?.contentId).toBe(readContent()[0]?.id);
    expect(readTasks()[0]?.updatedAt).toBeTruthy();
    expect(readContent()[0]?.plannedDate).toBe(futureDate);
    expect(readContent()[0]?.status).toBe("in-review");
  });

  it("preserves malformed saved content before recovering the store", async () => {
    const damagedValue = '{"records":';
    window.localStorage.setItem("creatorhub_content_v2", damagedValue);

    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));
    await waitFor(() => expect(window.localStorage.getItem("creatorhub_content_v2")).toBe("[]"));

    const recoveryKey = Object.keys(window.localStorage).find((key) =>
      key.startsWith("creatorhub_content_v2_recovery_"),
    );
    expect(recoveryKey).toBeTruthy();
    expect(window.localStorage.getItem(recoveryKey!)).toBe(damagedValue);
    expect(readContent()).toHaveLength(0);
  });

  it("backs up invalid local dates before normalizing them", async () => {
    const damagedRecords = JSON.stringify([
      {
        id: "bad-date",
        title: "A dated idea",
        description: "",
        platform: "YouTube",
        format: "Video",
        topic: "",
        tags: [],
        status: "planned",
        plannedDate: "2026-02-31",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ]);
    window.localStorage.setItem("creatorhub_content_v2", damagedRecords);

    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));
    await waitFor(() => expect(readContent()[0]?.plannedDate).toBe(null));

    const recoveryKey = Object.keys(window.localStorage).find((key) =>
      key.startsWith("creatorhub_content_v2_recovery_"),
    );
    expect(recoveryKey).toBeTruthy();
    expect(window.localStorage.getItem(recoveryKey!)).toBe(damagedRecords);
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
    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));

    const content = readContent();
    expect(content).toHaveLength(2);
    expect(content.map((c) => c.id).sort()).toEqual(["c1", "i1"]);
    const scheduled = content.find((c) => c.id === "c1");
    expect(scheduled?.status).toBe("planned");
    expect(scheduled?.plannedDate).toBe("2026-10-14");

    const tasks = readTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.contentId).toBe("c1");
    expect(tasks[0]!.dueDate).toBe(todayString());
  });
});
