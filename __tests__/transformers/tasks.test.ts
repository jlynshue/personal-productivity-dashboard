import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fs/promises before importing the module under test
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

import { readFile } from "fs/promises";
import { buildFromTasks } from "@/lib/transformers/tasks";

const mockedReadFile = vi.mocked(readFile);

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    key: "TSK-1",
    title: "Test task",
    source: "jira",
    project: "anuba",
    priority: "HIGH",
    status: "in-progress",
    description: "A test task",
    assignee: "jonathan",
    created: "2026-06-01",
    updated: "2026-06-10",
    issue_type: "task",
    labels: [],
    story_points: null,
    due_date: null,
    wsjf_score: 42,
    wsjf_tier: "Critical",
    eisenhower: "do",
    conductor_repo: "",
    ...overrides,
  };
}

function makeUnifiedFile(tasks: ReturnType<typeof makeTask>[]) {
  return JSON.stringify({ metadata: { total_tasks: tasks.length }, tasks });
}

describe("tasks transformer — buildFromTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes tasks into correct swimlanes by project name", async () => {
    const tasks = [
      makeTask({ key: "A-1", project: "anuba", status: "in-progress" }),
      makeTask({ key: "C-1", project: "career", status: "backlog" }),
      makeTask({ key: "F-1", project: "finance", status: "todo" }),
      makeTask({ key: "P-1", project: "personal", status: "blocked" }),
      makeTask({ key: "D-1", project: "denmother", status: "in-progress" }),
    ];
    mockedReadFile.mockResolvedValueOnce(makeUnifiedFile(tasks));

    const result = await buildFromTasks();

    // 5 swimlanes: anuba, career, consulting, finance, personal
    expect(result.swimlanes).toHaveLength(5);
    const anuba = result.swimlanes.find((s) => s.key === "anuba");
    expect(anuba?.doing).toBe(1);

    const career = result.swimlanes.find((s) => s.key === "career");
    expect(career?.backlog).toBe(1);

    // "denmother" normalizes to "consulting"
    const consulting = result.swimlanes.find((s) => s.key === "consulting");
    expect(consulting?.doing).toBe(1);

    const personal = result.swimlanes.find((s) => s.key === "personal");
    // blocked items go into backlog count
    expect(personal?.backlog).toBe(1);
  });

  it("normalizes variant project names to canonical lanes", async () => {
    const tasks = [
      makeTask({ key: "AT-1", project: "Anuba Technologies", status: "in-progress" }),
      makeTask({ key: "AT-2", project: "anuba tech", status: "backlog" }),
      makeTask({ key: "AT-3", project: "AT", status: "todo" }),
    ];
    mockedReadFile.mockResolvedValueOnce(makeUnifiedFile(tasks));

    const result = await buildFromTasks();
    const anuba = result.swimlanes.find((s) => s.key === "anuba");
    // All 3 should be in the anuba lane
    expect(anuba?.planned).toBe(3);
    expect(anuba?.doing).toBe(1);
    expect(anuba?.backlog).toBe(2);
  });

  it("routes ops-category projects into the ops bucket, not swimlanes", async () => {
    const tasks = [
      makeTask({ key: "O-1", project: "board-ops", status: "blocked" }),
      makeTask({ key: "O-2", project: "infra", status: "in-progress" }),
      makeTask({ key: "O-3", project: "finops", status: "backlog" }),
      makeTask({ key: "O-4", project: "", status: "todo" }),
    ];
    mockedReadFile.mockResolvedValueOnce(makeUnifiedFile(tasks));

    const result = await buildFromTasks();
    // All ops tasks should NOT appear in any swimlane
    const totalInSwim = result.swimlanes.reduce((sum, s) => sum + s.planned, 0);
    expect(totalInSwim).toBe(0);

    // Ops should capture them
    expect(result.ops.open).toBe(4);
    expect(result.ops.blockers).toBe(1);
  });

  it("handles empty task list gracefully", async () => {
    mockedReadFile.mockResolvedValueOnce(makeUnifiedFile([]));

    const result = await buildFromTasks();
    expect(result.swimlanes).toHaveLength(5);
    result.swimlanes.forEach((s) => {
      expect(s.planned).toBe(0);
      expect(s.doing).toBe(0);
      expect(s.backlog).toBe(0);
      expect(s.daysDark).toBe(99);
      expect(s.nextShip).toBe("No active work");
    });
    expect(result.stalled).toHaveLength(0);
    expect(result.projects).toHaveLength(5);
  });

  it("maps priority strings to P1-P4 labels", async () => {
    const tasks = [
      makeTask({ key: "P-1", project: "career", priority: "CRITICAL", status: "in-progress" }),
      makeTask({ key: "P-2", project: "career", priority: "HIGH", status: "backlog" }),
      makeTask({ key: "P-3", project: "career", priority: "MEDIUM", status: "todo" }),
      makeTask({ key: "P-4", project: "career", priority: "LOW", status: "todo" }),
    ];
    mockedReadFile.mockResolvedValueOnce(makeUnifiedFile(tasks));

    const result = await buildFromTasks();
    const cards = result.laneDetail["career"].cards;
    expect(cards[0].priority).toBe("P1"); // CRITICAL
    expect(cards[1].priority).toBe("P2"); // HIGH (highest wsjf_score sorts first but same score)
  });

  it("detects stalled items from blocked status or stale in-progress", async () => {
    const staleDate = "2026-05-01"; // >14 days ago from any 2026-06 run
    const tasks = [
      makeTask({
        key: "S-1",
        project: "anuba",
        status: "blocked",
        updated: "2026-06-09",
        title: "Blocked task",
      }),
      makeTask({
        key: "S-2",
        project: "career",
        status: "in-progress",
        updated: staleDate,
        title: "Stale in-progress",
      }),
      makeTask({
        key: "S-3",
        project: "finance",
        status: "in-progress",
        updated: "2026-06-10",
        title: "Fresh in-progress",
      }),
    ];
    mockedReadFile.mockResolvedValueOnce(makeUnifiedFile(tasks));

    const result = await buildFromTasks();
    // Blocked task and stale in-progress should appear, fresh one should not
    const stalledIds = result.stalled.map((s) => s.id);
    expect(stalledIds).toContain("S-1");
    expect(stalledIds).toContain("S-2");
    expect(stalledIds).not.toContain("S-3");
  });

  it("sorts lane detail cards by wsjf_score descending", async () => {
    const tasks = [
      makeTask({ key: "W-1", project: "anuba", status: "backlog", wsjf_score: 10, title: "Low score" }),
      makeTask({ key: "W-2", project: "anuba", status: "in-progress", wsjf_score: 99, title: "High score" }),
      makeTask({ key: "W-3", project: "anuba", status: "todo", wsjf_score: 55, title: "Mid score" }),
    ];
    mockedReadFile.mockResolvedValueOnce(makeUnifiedFile(tasks));

    const result = await buildFromTasks();
    const cards = result.laneDetail["anuba"].cards;
    expect(cards[0].title).toBe("High score");
    expect(cards[1].title).toBe("Mid score");
    expect(cards[2].title).toBe("Low score");
  });

  it("computes project status based on activity recency and blocked ratio", async () => {
    const recentDate = new Date().toISOString().split("T")[0];
    const tasks = [
      makeTask({ key: "M-1", project: "anuba", status: "in-progress", updated: recentDate }),
      makeTask({ key: "M-2", project: "career", status: "blocked", updated: "2026-01-01" }),
      makeTask({ key: "M-3", project: "career", status: "blocked", updated: "2026-01-02" }),
    ];
    mockedReadFile.mockResolvedValueOnce(makeUnifiedFile(tasks));

    const result = await buildFromTasks();
    const anuba = result.projects.find((p) => p.id === "anuba");
    expect(anuba?.status).toBe("moving");

    const career = result.projects.find((p) => p.id === "career");
    // All blocked, no doing -> "avoiding"
    expect(career?.status).toBe("avoiding");
  });
});
