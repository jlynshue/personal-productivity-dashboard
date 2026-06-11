import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fs/promises before importing the module under test
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

import { readFile, readdir } from "fs/promises";
import { computeExecution } from "@/lib/transformers/execution";

const mockedReadFile = vi.mocked(readFile);
const mockedReaddir = vi.mocked(readdir);

function makeDoneCard(title: string, modified: string, stream = "anuba") {
  return [
    "---",
    `title: "${title}"`,
    "status: done",
    `modified: "${modified}"`,
    `stream: ${stream}`,
    "---",
    "",
    `# ${title}`,
    "Content here.",
  ].join("\n");
}

function makeSprintLog(entries: { date: string; card: string }[]) {
  const lines: string[] = [];
  let currentDate = "";
  for (const e of entries) {
    if (e.date !== currentDate) {
      currentDate = e.date;
      lines.push(`## ${currentDate}`);
    }
    lines.push(`- [14:30] ${e.card}: status -> done`);
  }
  return lines.join("\n");
}

describe("execution transformer — computeExecution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes execution metrics from done cards in vault", async () => {
    const today = new Date().toISOString().split("T")[0];
    const files = ["anuba-deploy-pipeline.md", "career-essay.md", "_template.md"];
    mockedReaddir.mockResolvedValue(files as unknown as never);
    mockedReadFile.mockImplementation(async (path) => {
      const p = String(path);
      if (p.includes("anuba-deploy-pipeline")) return makeDoneCard("Deploy Pipeline", today);
      if (p.includes("career-essay")) return makeDoneCard("Execution Gap Essay", today, "career");
      return "";
    });

    const result = await computeExecution();
    expect(result.shipped).toBeGreaterThanOrEqual(2);
    expect(result.lastShip).toBeDefined();
    expect(result.daysSinceLastShip).toBe(0);
    expect(result.ratio).toBeGreaterThan(0);
    expect(result.weeks).toHaveLength(10);
  });

  it("deduplicates ships from done cards and sprint logs", async () => {
    const today = new Date().toISOString().split("T")[0];
    const files = ["anuba-feature.md", "_sprint-log-2026-W24.md"];
    mockedReaddir.mockResolvedValue(files as unknown as never);
    mockedReadFile.mockImplementation(async (path) => {
      const p = String(path);
      if (p.includes("anuba-feature")) return makeDoneCard("Feature X", today);
      if (p.includes("_sprint-log")) {
        return makeSprintLog([
          { date: today, card: "Feature X" }, // duplicate of the done card
          { date: today, card: "Feature Y" }, // unique
        ]);
      }
      return "";
    });

    const result = await computeExecution();
    // Feature X should be deduped (appears in both done cards and log)
    // Total: Feature X + Feature Y = 2
    expect(result.shipped).toBe(2);
  });

  it("returns safe defaults when vault is inaccessible", async () => {
    mockedReaddir.mockRejectedValue(new Error("ENOENT"));

    const result = await computeExecution();
    expect(result.shipped).toBe(0);
    expect(result.planned).toBeGreaterThan(0); // baseline planning always produces planned > 0
    expect(result.ratio).toBe(0);
    expect(result.daysSinceLastShip).toBe(99);
    expect(result.lastShip).toBe("Unknown");
    expect(result.weeks).toHaveLength(10);
  });

  it("builds a 10-week rolling window with week labels", async () => {
    mockedReaddir.mockResolvedValue([] as unknown as never);

    const result = await computeExecution();
    expect(result.weeks).toHaveLength(10);
    expect(result.window).toBe("10w");
    // Each week should have a W-prefixed label
    for (const week of result.weeks) {
      expect(week.w).toMatch(/^W\d+$/);
      expect(week.planned).toBeGreaterThanOrEqual(4); // baseline minimum
      expect(week.shipped).toBeGreaterThanOrEqual(0);
    }
  });

  it("caps ratio at 1.0 even when shipped exceeds planned", async () => {
    // Create many done cards so shipped > planned baseline
    const today = new Date().toISOString().split("T")[0];
    const files = Array.from({ length: 50 }, (_, i) => `card-${i}.md`);
    mockedReaddir.mockResolvedValue(files as unknown as never);
    mockedReadFile.mockImplementation(async () => makeDoneCard("Ship", today));

    const result = await computeExecution();
    expect(result.ratio).toBeLessThanOrEqual(1);
  });

  it("skips files starting with underscore (except sprint logs)", async () => {
    const today = new Date().toISOString().split("T")[0];
    const files = ["_template.md", "_draft-idea.md", "real-card.md"];
    mockedReaddir.mockResolvedValue(files as unknown as never);
    mockedReadFile.mockImplementation(async (path) => {
      const p = String(path);
      if (p.includes("real-card")) return makeDoneCard("Real Card", today);
      // Templates and drafts should be ignored by the file filter
      return makeDoneCard("Should Not Count", today);
    });

    const result = await computeExecution();
    // Only "real-card.md" should be parsed (underscore-prefixed skipped)
    expect(result.shipped).toBe(1);
    expect(result.lastShip).toBe("Real Card");
  });
});
