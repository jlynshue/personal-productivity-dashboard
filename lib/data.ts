export interface WeekData {
  w: string;
  planned: number;
  shipped: number;
}

export interface Execution {
  window: string;
  planned: number;
  shipped: number;
  ratio: number;
  daysSinceLastShip: number;
  lastShip: string;
  weeks: WeekData[];
}

export interface TodayAction {
  date: string;
  action: string;
  why: string;
  status: "not-started" | "doing" | "done";
  scopedAt: string;
  project: string;
}

export interface Project {
  id: string;
  name: string;
  phase: string;
  lastShipDays: number;
  built: number;
  shipped: number;
  status: "moving" | "stalled" | "avoiding";
}

export interface Indicator {
  id: string;
  label: string;
  unit: string;
  value: number;
  target: string;
  good: boolean;
  spark: number[];
}

export interface Indicators {
  leading: Indicator[];
  lagging: Indicator[];
}

export interface ReAsk {
  id: number;
  q: string;
  count: number;
  source: string;
  promoted: boolean;
}

export interface FocusSegment {
  t: string;
  type: "deep" | "shallow" | "switch" | "break";
  len: number;
  label: string;
}

export interface Focus {
  fragmentationScore: number;
  switchesToday: number;
  deepMinutes: number;
  shallowMinutes: number;
  longestBlock: number;
  timeline: FocusSegment[];
}

export interface LaneMail {
  unread: number;
  drafted: number;
  sent: number;
}

export interface Swimlane {
  key: string;
  name: string;
  blurb: string;
  planned: number;
  shipped: number;
  backlog: number;
  doing: number;
  daysDark: number;
  mail: LaneMail;
  nextShip: string;
}

export interface OpsItem {
  lane: string;
  note: string;
  blocker: boolean;
}

export interface Ops {
  lanes: string[];
  open: number;
  blockers: number;
  planned: number;
  shipped: number;
  items: OpsItem[];
}

export interface EmailItem {
  from: string;
  subject: string;
  days: number;
  need: "reply" | "send" | "decide";
}

export interface EmailAccount {
  id: string;
  label: string;
  lane: string;
  kind: string;
  unread: number;
  urgent: EmailItem[];
}

export interface Email {
  accounts: EmailAccount[];
}

export interface Card {
  title: string;
  status: string;
  age: number;
  priority: string;
  updated: number;
  desc: string;
  next: string;
}

export interface InboxItem {
  from: string;
  subject: string;
  days: number;
  need: "reply" | "send" | "decide";
}

export interface NoteItem {
  title: string;
  type: string;
  updated: number;
}

export interface EventItem {
  date: string;
  title: string;
  kind: "meeting" | "deadline" | "block";
}

export interface LaneDetail {
  cards: Card[];
  inbox: InboxItem[];
  notes: NoteItem[];
  events: EventItem[];
}

export interface StalledItem {
  id: string;
  name: string;
  days: number;
  nextStep: string;
  weight: string;
}

export interface DashData {
  TODAY: string;
  execution: Execution;
  today: TodayAction;
  projects: Project[];
  indicators: Indicators;
  reAsks: ReAsk[];
  focus: Focus;
  stalled: StalledItem[];
  swimlanes: Swimlane[];
  ops: Ops;
  email: Email;
  laneDetail: Record<string, LaneDetail>;
}

const TODAY = "2026-06-07";

export const DASH: DashData = {
  TODAY,
  execution: {
    window: "30d",
    planned: 41,
    shipped: 9,
    ratio: 9 / 41,
    daysSinceLastShip: 11,
    lastShip: "v2 of the Prompt-Library README (pushed, not announced)",
    weeks: [
      { w: "W14", planned: 6, shipped: 3 },
      { w: "W15", planned: 5, shipped: 2 },
      { w: "W16", planned: 8, shipped: 2 },
      { w: "W17", planned: 7, shipped: 1 },
      { w: "W18", planned: 9, shipped: 3 },
      { w: "W19", planned: 6, shipped: 1 },
      { w: "W20", planned: 10, shipped: 2 },
      { w: "W21", planned: 8, shipped: 1 },
      { w: "W22", planned: 11, shipped: 2 },
      { w: "W23", planned: 9, shipped: 1 },
    ],
  },
  today: {
    date: TODAY,
    action: "Publish the dashboard spec note + share the link in #build",
    why: "Outward-facing. It leaves your machine. That’s the whole point.",
    status: "not-started",
    scopedAt: "2026-06-07 08:40",
    project: "Personal Productivity Dashboard",
  },
  projects: [
    { id: "ppd", name: "Personal Productivity Dashboard", phase: "design", lastShipDays: 0, built: 14, shipped: 0, status: "moving" },
    { id: "promptlib", name: "Prompt Library", phase: "maintain", lastShipDays: 11, built: 38, shipped: 6, status: "moving" },
    { id: "harness", name: "Harness-Loop Runner", phase: "build", lastShipDays: 23, built: 27, shipped: 1, status: "stalled" },
    { id: "vaultsync", name: "Vault Sync / MOC Automation", phase: "build", lastShipDays: 34, built: 19, shipped: 0, status: "avoiding" },
    { id: "goose", name: "Goose Session Analyzer", phase: "explore", lastShipDays: 47, built: 9, shipped: 0, status: "avoiding" },
    { id: "cmdcenter", name: "Command Center Dashboard", phase: "maintain", lastShipDays: 6, built: 12, shipped: 4, status: "moving" },
  ],
  indicators: {
    leading: [
      { id: "daily", label: "Daily note written", unit: "streak", value: 23, target: "daily", good: true, spark: [1, 1, 1, 1, 1, 1, 1] },
      { id: "deep", label: "Deep-work blocks (>45m, no switch)", unit: "today", value: 1, target: "3/day", good: false, spark: [3, 2, 1, 2, 1, 1, 1] },
      { id: "tools", label: "Tools / automations built", unit: "30d", value: 14, target: "—", good: true, spark: [1, 2, 1, 3, 2, 3, 2] },
      { id: "scope", label: "Things scoped but not started", unit: "open", value: 32, target: "< 10", good: false, spark: [18, 22, 25, 28, 30, 31, 32] },
    ],
    lagging: [
      { id: "ships", label: "Outward-facing ships", unit: "30d", value: 9, target: "16", good: false, spark: [3, 2, 2, 1, 3, 1, 2] },
      { id: "announced", label: "Ships actually announced", unit: "30d", value: 2, target: "—", good: false, spark: [1, 0, 0, 1, 0, 0, 0] },
      { id: "feedback", label: "External replies / feedback", unit: "30d", value: 5, target: "—", good: false, spark: [2, 1, 0, 1, 0, 1, 0] },
    ],
  },
  reAsks: [
    { id: 1, q: "What are my active projects + their priority right now?", count: 31, source: "Claude Code · MEMORY.md", promoted: false },
    { id: 2, q: "Which things have I planned but not shipped?", count: 27, source: "Claude Code · Sprint Board", promoted: false },
    { id: 3, q: "What did I do yesterday / this week?", count: 22, source: "Copilot · Daily Notes", promoted: false },
    { id: 4, q: "What’s the standard frontmatter schema for this note type?", count: 19, source: "Copilot · MOCs", promoted: true },
    { id: 5, q: "What’s blocking the harness-loop runner again?", count: 14, source: "Claude Code", promoted: false },
    { id: 6, q: "Re-deriving the mixture-of-experts prompt scaffold", count: 12, source: "Prompt Library", promoted: true },
  ],
  focus: {
    fragmentationScore: 0.68,
    switchesToday: 19,
    deepMinutes: 96,
    shallowMinutes: 188,
    longestBlock: 52,
    timeline: [
      { t: "08:00", type: "deep", len: 52, label: "Dashboard data model" },
      { t: "08:52", type: "switch", len: 6, label: "Slack / email peek" },
      { t: "08:58", type: "shallow", len: 24, label: "Vault triage" },
      { t: "09:22", type: "switch", len: 8, label: "Re-ask: active projects?" },
      { t: "09:30", type: "deep", len: 31, label: "Prompt-Library edit" },
      { t: "10:01", type: "switch", len: 11, label: "Context reload" },
      { t: "10:12", type: "shallow", len: 40, label: "Reading transcripts" },
      { t: "10:52", type: "break", len: 18, label: "Break" },
      { t: "11:10", type: "switch", len: 9, label: "New rabbit hole: Goose DB" },
      { t: "11:19", type: "shallow", len: 44, label: "Goose schema spelunking" },
      { t: "12:03", type: "switch", len: 7, label: "Re-ask: frontmatter schema?" },
      { t: "12:10", type: "deep", len: 13, label: "Spec note draft" },
    ],
  },
  swimlanes: [
    { key: "anuba", name: "Anuba", blurb: "product · the main build", planned: 11, shipped: 3, backlog: 8, doing: 3, daysDark: 4, mail: { unread: 9, drafted: 4, sent: 6 }, nextShip: "Tag v0.3 and post the changelog where people can see it." },
    { key: "career", name: "Career", blurb: "outward identity · roles, writing", planned: 6, shipped: 0, backlog: 5, doing: 1, daysDark: 19, mail: { unread: 7, drafted: 5, sent: 1 }, nextShip: "Send the 2 drafted DMs. They have sat for 9 days." },
    { key: "consulting", name: "Consulting", blurb: "client work · billable", planned: 8, shipped: 2, backlog: 4, doing: 2, daysDark: 6, mail: { unread: 5, drafted: 2, sent: 4 }, nextShip: "Invoice client B. The work is done; the money is not." },
    { key: "finance", name: "Finance", blurb: "money systems · runway", planned: 4, shipped: 2, backlog: 2, doing: 1, daysDark: 8, mail: { unread: 3, drafted: 1, sent: 3 }, nextShip: "Automate the statement import you re-do by hand monthly." },
    { key: "personal", name: "Personal", blurb: "life admin · health, home", planned: 6, shipped: 1, backlog: 4, doing: 1, daysDark: 12, mail: { unread: 12, drafted: 2, sent: 3 }, nextShip: "Book the appointment you keep re-scoping instead of making." },
  ],
  ops: {
    lanes: ["board-ops", "finops", "infrastructure"],
    open: 17,
    blockers: 2,
    planned: 6,
    shipped: 1,
    items: [
      { lane: "infrastructure", note: "vault backup cron is silently failing", blocker: true },
      { lane: "finops", note: "monthly cloud-spend review is overdue", blocker: true },
      { lane: "board-ops", note: "7 cards need triage / lane assignment", blocker: false },
    ],
  },
  email: {
    accounts: [
      {
        id: "anuba", label: "jon@anuba.dev", lane: "anuba", kind: "work", unread: 38, urgent: [
          { from: "Seed investor", subject: "Re: deck follow-up — still need the metrics slide", days: 3, need: "reply" },
          { from: "Design partner", subject: "Are we shipping the v0.3 build this week?", days: 1, need: "decide" },
        ],
      },
      {
        id: "consulting", label: "jon@lynshue.co", lane: "consulting", kind: "clients", unread: 12, urgent: [
          { from: "Client B · Accounts", subject: "Invoice #0042 — 14 days overdue", days: 14, need: "send" },
          { from: "Client A", subject: "Statement of work — needs your sign-off", days: 5, need: "decide" },
        ],
      },
      {
        id: "personal", label: "jonathan.lynshue@gmail.com", lane: "personal", kind: "personal", unread: 211, urgent: [
          { from: "Landlord", subject: "Lease renewal — respond by Friday", days: 2, need: "decide" },
          { from: "Dr. Okafor · Dental", subject: "Confirm your appointment (2nd reminder)", days: 9, need: "reply" },
        ],
      },
    ],
  },
  stalled: [
    { id: "vaultsync", name: "Vault Sync / MOC Automation", days: 34, nextStep: "Push the MOC-row script (it works — you just haven’t pushed it)", weight: "outward" },
    { id: "goose", name: "Goose Session Analyzer", days: 47, nextStep: "Decide: ship the read-only query, or kill the project", weight: "decision" },
    { id: "harness", name: "Harness-Loop Runner", days: 23, nextStep: "Write the 4-line README and tag a v0.1", weight: "outward" },
  ],
  laneDetail: {
    anuba: {
      cards: [
        { title: "Wire the v0.3 release pipeline", status: "doing", age: 2, priority: "P1", updated: 1, desc: "CI builds are green; still missing the publish step + signed artifacts.", next: "Add the release-publish action" },
        { title: "Metrics slide for the investor deck", status: "doing", age: 3, priority: "P1", updated: 3, desc: "Numbers are in the sheet; the slide isn’t built. Investor is waiting.", next: "Drop the 4 KPIs into the deck" },
        { title: "Onboarding empty-state copy", status: "backlog", age: 6, priority: "P2", updated: 6, desc: "First-run screen still shows placeholder text.", next: "Write 3 empty-state strings" },
      ],
      inbox: [
        { from: "Seed investor", subject: "Re: deck follow-up — metrics slide", days: 3, need: "reply" },
        { from: "Design partner", subject: "Ship the v0.3 build this week?", days: 1, need: "decide" },
      ],
      notes: [
        { title: "Anuba — Product MOC", type: "MOC", updated: 1 },
        { title: "v0.3 Release Checklist", type: "note", updated: 2 },
        { title: "Agent-eval harness spec", type: "spec", updated: 5 },
      ],
      events: [
        { date: "Mon 8", title: "Design partner sync", kind: "meeting" },
        { date: "Wed 10", title: "v0.3 ship target", kind: "deadline" },
        { date: "Fri 12", title: "Deep-work block · release", kind: "block" },
      ],
    },
    career: {
      cards: [
        { title: "Publish the “execution gap” essay", status: "doing", age: 9, priority: "P1", updated: 9, desc: "Draft is ~80% done and has sat unpublished for 9 days.", next: "Final edit pass, then publish" },
        { title: "Refresh portfolio + bio", status: "backlog", age: 21, priority: "P3", updated: 21, desc: "Bio is a year stale; no recent work is shown.", next: "Swap in 2 recent projects" },
      ],
      inbox: [
        { from: "Recruiter · Foundry", subject: "Re: staff role — are you open?", days: 6, need: "reply" },
        { from: "Newsletter editor", subject: "Still want the guest post?", days: 11, need: "reply" },
      ],
      notes: [
        { title: "Career — Identity MOC", type: "MOC", updated: 8 },
        { title: "Essay drafts · execution gap", type: "note", updated: 9 },
      ],
      events: [
        { date: "Tue 9", title: "Recruiter call (unconfirmed)", kind: "meeting" },
        { date: "Thu 11", title: "Essay self-imposed deadline", kind: "deadline" },
      ],
    },
    consulting: {
      cards: [
        { title: "Client B — final deliverable handoff", status: "doing", age: 4, priority: "P1", updated: 2, desc: "Work is complete; handoff doc + invoice are still pending.", next: "Send handoff + invoice #0042" },
        { title: "Client A — SOW revision", status: "doing", age: 5, priority: "P2", updated: 5, desc: "Scope changed; the SOW needs your sign-off.", next: "Approve or redline the SOW" },
        { title: "Scope the new retainer", status: "backlog", age: 12, priority: "P2", updated: 12, desc: "Verbal yes received; nothing is written down.", next: "Draft a one-page retainer" },
      ],
      inbox: [
        { from: "Client B · Accounts", subject: "Invoice #0042 — 14 days overdue", days: 14, need: "send" },
        { from: "Client A", subject: "SOW — needs your sign-off", days: 5, need: "decide" },
      ],
      notes: [
        { title: "Consulting — Clients MOC", type: "MOC", updated: 3 },
        { title: "Client B — Engagement notes", type: "note", updated: 4 },
        { title: "Rate card / SOW template", type: "template", updated: 18 },
      ],
      events: [
        { date: "Mon 8", title: "Client A check-in", kind: "meeting" },
        { date: "Tue 9", title: "Invoice #0042 due (overdue)", kind: "deadline" },
      ],
    },
    finance: {
      cards: [
        { title: "Automate the statement import", status: "doing", age: 3, priority: "P2", updated: 3, desc: "Monthly CSV import is still done by hand.", next: "Wire the import script to the sheet" },
        { title: "Q2 runway model refresh", status: "backlog", age: 9, priority: "P2", updated: 9, desc: "Model is still running on Q1 numbers.", next: "Pull Q2 actuals into the model" },
      ],
      inbox: [
        { from: "Accountant", subject: "Need receipts for Q1 close", days: 4, need: "send" },
      ],
      notes: [
        { title: "Finance — Money MOC", type: "MOC", updated: 6 },
        { title: "Runway model", type: "sheet", updated: 8 },
      ],
      events: [
        { date: "Wed 10", title: "Monthly finance review", kind: "block" },
        { date: "Fri 12", title: "Cloud-spend review", kind: "deadline" },
      ],
    },
    personal: {
      cards: [
        { title: "Lease renewal decision", status: "doing", age: 2, priority: "P1", updated: 2, desc: "Landlord needs an answer by Friday.", next: "Decide: renew or give notice" },
        { title: "Book the dental appointment", status: "backlog", age: 9, priority: "P3", updated: 9, desc: "2nd reminder received; keeps getting re-scoped.", next: "Call and book a slot" },
      ],
      inbox: [
        { from: "Landlord", subject: "Lease renewal — respond by Friday", days: 2, need: "decide" },
        { from: "Dr. Okafor · Dental", subject: "Confirm appointment (2nd reminder)", days: 9, need: "reply" },
      ],
      notes: [
        { title: "Personal — Life MOC", type: "MOC", updated: 4 },
        { title: "Home / lease docs", type: "note", updated: 12 },
      ],
      events: [
        { date: "Fri 12", title: "Lease renewal deadline", kind: "deadline" },
        { date: "Sun 14", title: "Admin catch-up block", kind: "block" },
      ],
    },
  },
};
