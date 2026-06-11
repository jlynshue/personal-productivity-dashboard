import { describe, it, expect } from "vitest";
import { DASH } from "@/lib/data";
import type {
  DashData,
  Execution,
  Swimlane,
  Project,
  Email,
  StalledItem,
} from "@/lib/data";

/**
 * Tests for the static dashboard data model in lib/data.ts.
 * These validate structural integrity and business rule invariants
 * of the mock/seed data that drives local development.
 */

describe("dashboard data model — structural integrity", () => {
  it("exports a complete DashData object with all required fields", () => {
    const required: (keyof DashData)[] = [
      "TODAY",
      "execution",
      "today",
      "projects",
      "indicators",
      "reAsks",
      "focus",
      "stalled",
      "swimlanes",
      "ops",
      "email",
      "laneDetail",
    ];
    for (const key of required) {
      expect(DASH[key]).toBeDefined();
    }
  });

  it("execution metrics maintain mathematical consistency", () => {
    const exec: Execution = DASH.execution;
    expect(exec.shipped).toBeLessThanOrEqual(exec.planned);
    expect(exec.ratio).toBeCloseTo(exec.shipped / exec.planned, 2);
    expect(exec.ratio).toBeGreaterThanOrEqual(0);
    expect(exec.ratio).toBeLessThanOrEqual(1);
    expect(exec.weeks).toHaveLength(10);

    // Each week: shipped <= planned
    for (const week of exec.weeks) {
      expect(week.shipped).toBeLessThanOrEqual(week.planned);
      expect(week.w).toMatch(/^W\d+$/);
    }
  });

  it("swimlanes cover all 5 major lanes with valid data", () => {
    const expectedLanes = ["anuba", "career", "consulting", "finance", "personal"];
    const laneKeys = DASH.swimlanes.map((s: Swimlane) => s.key);
    expect(laneKeys).toEqual(expectedLanes);

    for (const lane of DASH.swimlanes) {
      expect(lane.name.length).toBeGreaterThan(0);
      expect(lane.planned).toBeGreaterThanOrEqual(0);
      expect(lane.doing).toBeGreaterThanOrEqual(0);
      expect(lane.backlog).toBeGreaterThanOrEqual(0);
      expect(lane.daysDark).toBeGreaterThanOrEqual(0);
      expect(lane.mail).toBeDefined();
      expect(lane.nextShip.length).toBeGreaterThan(0);
    }
  });

  it("projects have valid status values from the allowed set", () => {
    const validStatuses = ["moving", "stalled", "avoiding"];
    for (const project of DASH.projects) {
      expect(validStatuses).toContain(project.status);
      expect(project.lastShipDays).toBeGreaterThanOrEqual(0);
      expect(project.name.length).toBeGreaterThan(0);
    }
  });

  it("stalled items have positive age and actionable next steps", () => {
    for (const item of DASH.stalled) {
      expect(item.days).toBeGreaterThan(0);
      expect(item.nextStep.length).toBeGreaterThan(0);
      expect(item.name.length).toBeGreaterThan(0);
    }
  });
});

describe("dashboard data model — business rules", () => {
  it("email accounts each have a valid kind from expected set", () => {
    const validKinds = ["work", "personal", "clients"];
    for (const account of DASH.email.accounts) {
      expect(validKinds).toContain(account.kind);
      expect(account.unread).toBeGreaterThanOrEqual(0);
      for (const item of account.urgent) {
        expect(["reply", "send", "decide"]).toContain(item.need);
        expect(item.days).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("lane detail exists for every swimlane key", () => {
    for (const lane of DASH.swimlanes) {
      expect(DASH.laneDetail[lane.key]).toBeDefined();
      const detail = DASH.laneDetail[lane.key];
      expect(detail.cards).toBeDefined();
      expect(detail.inbox).toBeDefined();
      expect(detail.notes).toBeDefined();
      expect(detail.events).toBeDefined();
    }
  });

  it("lane cards have valid priority labels and non-negative ages", () => {
    const validPriorities = ["P1", "P2", "P3", "P4"];
    for (const [, detail] of Object.entries(DASH.laneDetail)) {
      for (const card of detail.cards) {
        expect(validPriorities).toContain(card.priority);
        expect(card.age).toBeGreaterThanOrEqual(0);
        expect(card.updated).toBeGreaterThanOrEqual(0);
        expect(card.title.length).toBeGreaterThan(0);
      }
    }
  });

  it("indicators split into leading (forecast) and lagging (actual)", () => {
    expect(DASH.indicators.leading.length).toBeGreaterThan(0);
    expect(DASH.indicators.lagging.length).toBeGreaterThan(0);

    for (const ind of [...DASH.indicators.leading, ...DASH.indicators.lagging]) {
      expect(ind.id.length).toBeGreaterThan(0);
      expect(ind.label.length).toBeGreaterThan(0);
      expect(ind.spark).toHaveLength(7); // 7-day sparkline
      expect(typeof ind.good).toBe("boolean");
    }
  });

  it("focus timeline has valid segment types and consistent metrics", () => {
    const segments = DASH.focus.timeline;
    expect(segments.length).toBeGreaterThan(0);

    const validTypes = ["deep", "shallow", "switch", "break"];
    for (const seg of segments) {
      expect(validTypes).toContain(seg.type);
      expect(seg.len).toBeGreaterThan(0);
      expect(seg.label.length).toBeGreaterThan(0);
      expect(seg.t).toMatch(/^\d{2}:\d{2}$/);
    }

    // Timeline deep minutes should not exceed reported total
    // (timeline is a sample window; total may include unlogged time)
    const deepFromTimeline = segments
      .filter((s) => s.type === "deep")
      .reduce((sum, s) => sum + s.len, 0);
    expect(DASH.focus.deepMinutes).toBeGreaterThanOrEqual(deepFromTimeline);

    // fragmentationScore should be between 0 and 1
    expect(DASH.focus.fragmentationScore).toBeGreaterThanOrEqual(0);
    expect(DASH.focus.fragmentationScore).toBeLessThanOrEqual(1);

    // longestBlock should match the longest deep segment in timeline
    const longestDeep = Math.max(
      ...segments.filter((s) => s.type === "deep").map((s) => s.len)
    );
    expect(DASH.focus.longestBlock).toBe(longestDeep);

    // switchesToday should be non-negative
    expect(DASH.focus.switchesToday).toBeGreaterThanOrEqual(0);
  });

  it("ops blockers count matches items marked as blocker", () => {
    const blockerItems = DASH.ops.items.filter((i) => i.blocker);
    expect(DASH.ops.blockers).toBe(blockerItems.length);
  });
});
