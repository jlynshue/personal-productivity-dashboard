"use client";

import { useState } from "react";
import {
  Panel,
  Spark,
  useCountUp,
  RatioBar,
  BandLegend,
  bandColor,
  bandName,
  STATUS,
} from "@/components/primitives";
import { DASH, Project } from "@/lib/data";

type Tone = "gentle" | "neutral" | "blunt";

type NudgeKind = "hero" | "sinceShip" | "action";

export function nudge(tone: Tone, kind: NudgeKind, data?: string | number): string {
  const M: Record<NudgeKind, Record<Tone, string | ((d: string | number) => string)>> = {
    hero: {
      gentle: `You've shipped ${data} of what you planned. Small and outward beats big and unseen.`,
      neutral: `${data} of planned work has gone outward this window.`,
      blunt: `You planned a lot and shipped ${data} of it. The plan is not the work.`,
    },
    sinceShip: {
      gentle: (d) => `${d} days since something left your machine. Today's a good day to change that.`,
      neutral: (d) => `${d} days since last outward-facing ship.`,
      blunt: (d) => `${d} days dark. Nobody has seen your work in ${d} days.`,
    },
    action: {
      gentle: "One thing. Outward-facing. You've got this.",
      neutral: "Today's single committed action.",
      blunt: "One thing. If this doesn't ship, today didn't count.",
    },
  };
  const v = M[kind][tone] || M[kind].neutral;
  return typeof v === "function" ? v(data!) : v;
}

interface HeroExecutionProps {
  tone: Tone;
  big?: boolean;
}

export function HeroExecution({ tone, big }: HeroExecutionProps) {
  const ex = DASH.execution;
  const ratio: number = ex.ratio;
  const color: string = bandColor(ratio);
  const animated: number = useCountUp(ratio * 100, 900);
  const pctStr: string = animated.toFixed(0);

  return (
    <Panel
      title="Execution Ratio · all lanes"
      glance="5s"
      accent={color}
      right={
        <span
          className="pill"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          rolling {ex.window}
        </span>
      }
      style={{ minHeight: big ? 300 : "auto" }}
    >
      <div
        style={{
          display: "flex",
          gap: big ? 28 : 18,
          alignItems: "stretch",
          flex: 1,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: 200,
            flex: "1 1 220px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              className="mono tnum"
              style={{
                fontSize: big ? 92 : 60,
                fontWeight: 600,
                lineHeight: 0.92,
                color,
                letterSpacing: "-0.03em",
              }}
            >
              {pctStr}
            </span>
            <span
              className="mono"
              style={{
                fontSize: big ? 30 : 22,
                fontWeight: 500,
                color: "var(--text-2)",
              }}
            >
              %
            </span>
            <span
              className="mono"
              style={{
                marginLeft: 8,
                fontSize: 11,
                color,
                alignSelf: "flex-start",
                marginTop: 8,
                letterSpacing: ".1em",
                fontWeight: 600,
              }}
            >
              {bandName(ratio)}
            </span>
          </div>
          <div
            className="mono tnum"
            style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6 }}
          >
            <span style={{ color: "var(--go)" }}>{ex.shipped} shipped</span>
            <span style={{ color: "var(--faint)" }}> / {ex.planned} planned</span>
          </div>
          <div style={{ marginTop: 14, maxWidth: 360 }}>
            <RatioBar
              shipped={ex.shipped}
              planned={ex.planned}
              color={color}
              height={big ? 13 : 11}
            />
          </div>
          <p
            style={{
              margin: "13px 0 0",
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--text-2)",
              maxWidth: 380,
              textWrap: "pretty",
            }}
          >
            {nudge(tone, "hero", `${(ratio * 100).toFixed(0)}%`)}
          </p>
          <div style={{ marginTop: 14 }}>
            <BandLegend ratio={ratio} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flex: "0 1 230px",
            minWidth: 190,
            justifyContent: "center",
            borderLeft: "1px solid var(--line-soft)",
            paddingLeft: big ? 24 : 16,
          }}
        >
          <div>
            <div className="kicker">Days since last ship</div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginTop: 6,
              }}
            >
              <span
                className="mono tnum"
                style={{
                  fontSize: 40,
                  fontWeight: 600,
                  color:
                    ex.daysSinceLastShip > 7 ? "var(--stop)" : "var(--warn)",
                  lineHeight: 1,
                }}
              >
                {ex.daysSinceLastShip}
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--muted)" }}
              >
                days dark
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--faint)",
                marginTop: 5,
                fontStyle: "italic",
                lineHeight: 1.4,
              }}
            >
              last: {ex.lastShip}
            </div>
          </div>
          <div
            style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 12 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="kicker">Ship trend · 10w</span>
              <span
                className="mono"
                style={{ fontSize: 10, color: "var(--stop)" }}
              >
                ▼ declining
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <Spark
                data={ex.weeks.map((w: { shipped: number }) => w.shipped)}
                color="var(--go)"
                w={200}
                h={34}
                fill
              />
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

const NEXT: Record<string, number> = {
  "not-started": 0,
  doing: 1,
  done: 2,
};

interface NextMeta {
  key: string;
  label: string;
  c: string;
}

const NEXT_META: NextMeta[] = [
  { key: "not-started", label: "Not started", c: "var(--stop)" },
  { key: "doing", label: "Doing", c: "var(--warn)" },
  { key: "done", label: "Shipped", c: "var(--go)" },
];

interface NextActionProps {
  status: string;
  setStatus: (s: string) => void;
  tone: Tone;
  big?: boolean;
}

export function NextAction({ status, setStatus, tone, big }: NextActionProps) {
  const t = DASH.today;
  const meta: NextMeta = NEXT_META[NEXT[status]];

  return (
    <Panel
      title="The One Thing · Today"
      glance="5s"
      accent={meta.c}
      right={
        <span
          className="mono"
          style={{ fontSize: 10, color: "var(--faint)" }}
        >
          scoped {t.scopedAt.split(" ")[1]}
        </span>
      }
      style={{ minHeight: big ? 300 : "auto" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div className="kicker" style={{ marginBottom: 9 }}>
            {nudge(tone, "action")}
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: big ? 30 : 22,
              fontWeight: 600,
              lineHeight: 1.18,
              letterSpacing: "-0.01em",
              textWrap: "balance",
              color: status === "done" ? "var(--muted)" : "var(--text)",
              textDecoration: status === "done" ? "line-through" : "none",
            }}
          >
            {t.action}
          </h2>
          <p
            style={{
              margin: "11px 0 0",
              fontSize: 13,
              color: "var(--text-2)",
              lineHeight: 1.5,
              maxWidth: 480,
              textWrap: "pretty",
            }}
          >
            {t.why}
          </p>
          <div
            style={{ display: "flex", gap: 7, marginTop: 13, flexWrap: "wrap" }}
          >
            <span
              className="pill"
              style={{ color: "var(--flow)", borderColor: "var(--flow-dim)" }}
            >
              <span className="dot" style={{ background: "var(--flow)" }} />
              {t.project}
            </span>
            <span className="pill" style={{ color: "var(--muted)" }}>
              outward-facing
            </span>
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: 4,
              background: "var(--bg-2)",
              borderRadius: 9,
              border: "1px solid var(--line-soft)",
            }}
          >
            {NEXT_META.map((m) => {
              const on: boolean = status === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setStatus(m.key)}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: 6,
                    border:
                      "1px solid " +
                      (on
                        ? m.c
                            .replace(")", " / 0.5)")
                            .replace("var(--", "oklch(")
                        : "transparent"),
                    background: on
                      ? "color-mix(in oklch, " + m.c + " 16%, transparent)"
                      : "transparent",
                    color: on ? m.c : "var(--muted)",
                    fontFamily: "var(--mono)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    letterSpacing: ".03em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                  }}
                >
                  <span
                    className="dot"
                    style={{ background: on ? m.c : "var(--faint)" }}
                  />
                  {m.label}
                </button>
              );
            })}
          </div>
          {status === "done" && (
            <div
              className="mono rise"
              style={{
                fontSize: 11,
                color: "var(--go)",
                marginTop: 9,
                textAlign: "center",
                letterSpacing: ".04em",
              }}
            >
              ✓ It left your machine. Days-dark resets to 0.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

interface ProjectMomentumProps {
  glance?: string;
}

export function ProjectMomentum({ glance = "30s" }: ProjectMomentumProps) {
  const [proj, setProj] = useState<Project[]>(DASH.projects);

  const cycle = (id: string): void =>
    setProj((p) =>
      p.map((x) => {
        if (x.id !== id) return x;
        const order: Array<"moving" | "stalled" | "avoiding"> = ["moving", "stalled", "avoiding"];
        return {
          ...x,
          status: order[(order.indexOf(x.status) + 1) % 3],
        };
      })
    );

  const moving: number = proj.filter((p) => p.status === "moving").length;

  return (
    <Panel
      title="Active Projects · Momentum"
      glance={glance}
      accent="var(--flow)"
      right={
        <span
          className="mono"
          style={{ fontSize: 10, color: "var(--muted)" }}
        >
          {moving}/{proj.length} moving
        </span>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
          overflowY: "auto",
        }}
      >
        {proj.map((p) => {
          const s = STATUS[p.status];
          const dark: boolean = p.lastShipDays > 21;
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 11px",
                background: "var(--bg-2)",
                border: "1px solid var(--line-soft)",
                borderRadius: 8,
              }}
            >
              <span
                className="dot"
                style={{
                  background: s.c,
                  boxShadow: `0 0 7px ${s.c}`,
                  flex: "none",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--faint)",
                    marginTop: 2,
                  }}
                >
                  {p.phase} · built {p.built} · shipped {p.shipped}
                </div>
              </div>
              <div style={{ textAlign: "right", flex: "none" }}>
                <div
                  className="mono tnum"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: dark ? "var(--stop)" : "var(--text-2)",
                  }}
                >
                  {p.lastShipDays}d
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 8.5,
                    color: "var(--faint)",
                    letterSpacing: ".05em",
                  }}
                >
                  dark
                </div>
              </div>
              <button
                onClick={() => cycle(p.id)}
                className="pill"
                style={{
                  color: s.c,
                  borderColor: s.c
                    .replace(")", " / 0.4)")
                    .replace("var(--", "oklch("),
                  background:
                    "color-mix(in oklch, " + s.c + " 12%, transparent)",
                  flex: "none",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                }}
              >
                {s.label}
              </button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
