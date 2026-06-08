import { readFile } from "fs/promises";
import { PATHS } from "@/lib/config";
import type {
  Swimlane,
  LaneDetail,
  Card,
  Project,
  StalledItem,
  Ops,
  OpsItem,
  LaneMail,
} from "@/lib/data";

interface UnifiedTask {
  key: string;
  title: string;
  source: string;
  project: string;
  priority: string;
  status: string;
  description: string;
  assignee: string;
  created: string;
  updated: string;
  issue_type: string;
  labels: string[];
  story_points: number | null;
  due_date: string | null;
  wsjf_score: number | null;
  wsjf_tier: string;
  eisenhower: string;
  conductor_repo: string;
}

interface UnifiedFile {
  metadata: { total_tasks: number };
  tasks: UnifiedTask[];
}

const DOING_STATUSES = ["in-progress", "this-sprint", "active", "human-action"];
const BACKLOG_STATUSES = ["backlog", "todo", "pending"];
const BLOCKED_STATUSES = ["blocked", "awaiting"];
const OPS_PROJECTS = ["board-ops", "infra", "finops", ""];

const LANE_META: Record<string, { name: string; blurb: string }> = {
  anuba: {
    name: "Anuba",
    blurb: "AI-powered restaurant operations platform",
  },
  career: { name: "Career", blurb: "Job search & professional development" },
  consulting: { name: "Consulting", blurb: "Client engagements & advisory" },
  finance: { name: "Finance", blurb: "Personal finance & tax" },
  personal: { name: "Personal", blurb: "Side projects & life ops" },
};

function normalizeLane(project: string): string {
  const p = project.toLowerCase().trim();
  if (p === "anuba technologies" || p === "anuba tech" || p === "at") return "anuba";
  if (p === "denmother") return "consulting";
  if (OPS_PROJECTS.includes(p)) return "_ops";
  if (Object.keys(LANE_META).includes(p)) return p;
  return "_ops";
}

function daysSince(dateStr: string): number {
  const d = Date.parse(dateStr);
  if (isNaN(d)) return 0;
  return Math.max(0, Math.floor((Date.now() - d) / 86400000));
}

function mapPriority(p: string): string {
  if (p === "CRITICAL") return "P1";
  if (p === "HIGH") return "P2";
  if (p === "MEDIUM") return "P3";
  return "P4";
}

export async function buildFromTasks(): Promise<{
  swimlanes: Swimlane[];
  laneDetail: Record<string, LaneDetail>;
  projects: Project[];
  stalled: StalledItem[];
  ops: Ops;
}> {
  const raw = await readFile(PATHS.unifiedTasks, "utf-8");
  const file: UnifiedFile = JSON.parse(raw);
  const tasks = file.tasks;

  const laneKeys = Object.keys(LANE_META);
  const laneGroups: Record<string, UnifiedTask[]> = {};
  const opsItems: UnifiedTask[] = [];

  for (const key of laneKeys) laneGroups[key] = [];

  for (const t of tasks) {
    const lane = normalizeLane(t.project);
    if (lane === "_ops") {
      opsItems.push(t);
    } else {
      laneGroups[lane].push(t);
    }
  }

  const swimlanes: Swimlane[] = laneKeys.map((key) => {
    const laneTasks = laneGroups[key];
    const doing = laneTasks.filter((t) => DOING_STATUSES.includes(t.status));
    const backlog = laneTasks.filter((t) =>
      BACKLOG_STATUSES.includes(t.status)
    );
    const blocked = laneTasks.filter((t) =>
      BLOCKED_STATUSES.includes(t.status)
    );
    const planned = laneTasks.length;
    const shipped = 0; // filled by execution transformer
    const lastUpdate = laneTasks.reduce(
      (max, t) => Math.max(max, Date.parse(t.updated) || 0),
      0
    );
    const daysDark = lastUpdate ? daysSince(new Date(lastUpdate).toISOString().split("T")[0]) : 99;

    return {
      key,
      name: LANE_META[key].name,
      blurb: LANE_META[key].blurb,
      planned,
      shipped,
      backlog: backlog.length + blocked.length,
      doing: doing.length,
      daysDark,
      mail: { unread: 0, drafted: 0, sent: 0 } as LaneMail,
      nextShip: doing[0]?.title || backlog[0]?.title || "No active work",
    };
  });

  const laneDetail: Record<string, LaneDetail> = {};
  for (const key of laneKeys) {
    const laneTasks = laneGroups[key];
    const cards: Card[] = laneTasks
      .filter((t) => [...DOING_STATUSES, ...BACKLOG_STATUSES].includes(t.status))
      .sort((a, b) => {
        const aScore = a.wsjf_score || 0;
        const bScore = b.wsjf_score || 0;
        return bScore - aScore;
      })
      .slice(0, 8)
      .map((t) => ({
        title: t.title,
        status: DOING_STATUSES.includes(t.status) ? "doing" : "backlog",
        age: daysSince(t.created),
        priority: mapPriority(t.priority),
        updated: daysSince(t.updated),
        desc: t.description || "",
        next: t.due_date
          ? `Due ${t.due_date}`
          : t.wsjf_tier === "Critical"
            ? "High priority — needs action"
            : "Awaiting triage",
      }));

    laneDetail[key] = {
      cards,
      inbox: [],
      notes: [],
      events: [],
    };
  }

  // Projects: one per lane
  const projects: Project[] = laneKeys.map((key) => {
    const laneTasks = laneGroups[key];
    const doing = laneTasks.filter((t) => DOING_STATUSES.includes(t.status));
    const blocked = laneTasks.filter((t) =>
      BLOCKED_STATUSES.includes(t.status)
    );
    const lastUpdate = laneTasks.reduce(
      (max, t) => Math.max(max, Date.parse(t.updated) || 0),
      0
    );
    const lastShipDays = lastUpdate ? daysSince(new Date(lastUpdate).toISOString().split("T")[0]) : 99;
    const status: "moving" | "stalled" | "avoiding" =
      doing.length > 0 && lastShipDays < 7
        ? "moving"
        : blocked.length > doing.length
          ? "avoiding"
          : "stalled";

    return {
      id: key,
      name: LANE_META[key].name,
      phase: doing.length > 0 ? "build" : "plan",
      lastShipDays,
      built: doing.length,
      shipped: 0,
      status,
    };
  });

  // Stalled: blocked or doing but stale >14 days
  const stalled: StalledItem[] = tasks
    .filter(
      (t) =>
        BLOCKED_STATUSES.includes(t.status) ||
        (DOING_STATUSES.includes(t.status) && daysSince(t.updated) > 14)
    )
    .sort((a, b) => daysSince(b.updated) - daysSince(a.updated))
    .slice(0, 5)
    .map((t) => ({
      id: t.key,
      name: t.title,
      days: daysSince(t.updated),
      nextStep: t.description || "Needs triage",
      weight: t.wsjf_tier === "Critical" ? "outward" : "decision",
    }));

  // Ops
  const opsDoing = opsItems.filter((t) => DOING_STATUSES.includes(t.status));
  const opsBlocked = opsItems.filter((t) =>
    BLOCKED_STATUSES.includes(t.status)
  );
  const ops: Ops = {
    lanes: ["board-ops", "infra", "finops"],
    open: opsItems.length,
    blockers: opsBlocked.length,
    planned: opsItems.length,
    shipped: 0,
    items: opsBlocked.slice(0, 4).map(
      (t): OpsItem => ({
        lane: t.project || "ops",
        note: t.title,
        blocker: true,
      })
    ),
  };

  return { swimlanes, laneDetail, projects, stalled, ops };
}
