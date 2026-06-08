"use client";

import React from "react";
import { Panel, RatioBar, bandColor, bandName } from "@/components/primitives";
import { Swimlane, LaneDetail } from "@/lib/data";
import { useDash } from "@/lib/dash-context";

/* ─── helpers ─── */

function ageColorW(days: number): string {
  if (days > 7) return "var(--stop)";
  if (days >= 3) return "var(--warn)";
  return "var(--flow)";
}

const NEED_W: Record<string, string> = {
  reply: "var(--flow)",
  send: "var(--stop)",
  decide: "var(--warn)",
};

const EVENT_W: Record<string, { c: string; label: string }> = {
  deadline: { c: "var(--stop)", label: "deadline" },
  meeting: { c: "var(--flow)", label: "meeting" },
  block: { c: "var(--go)", label: "focus" },
};

const PRIO_W: Record<string, string> = {
  P1: "var(--stop)",
  P2: "var(--warn)",
  P3: "var(--muted)",
};

/* ─── shared row ─── */

function WRow({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 9px",
        background: "var(--bg-2)",
        border: "1px solid var(--line-soft)",
        borderLeft: accent ? `3px solid ${accent}` : "1px solid var(--line-soft)",
        borderRadius: 7,
      }}
    >
      {children}
    </div>
  );
}

/* ─── WContext ─── */

function WContext({ lane, color }: { lane: Swimlane; color: string }) {
  const iRatio = lane.shipped / lane.planned;
  const m = lane.mail;
  const mTotal = m.unread + m.drafted + m.sent;
  const mRatio = mTotal ? m.sent / mTotal : 0;

  const Mini = ({ label, ratio }: { label: string; ratio: number }) => {
    const c = bandColor(ratio);
    return (
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span
            className="mono"
            style={{ fontSize: 9, color: "var(--muted)", letterSpacing: ".1em", textTransform: "uppercase" }}
          >
            {label}
          </span>
          <span className="mono tnum" style={{ fontSize: 15, fontWeight: 600, color: c }}>
            {Math.round(ratio * 100)}%
          </span>
        </div>
        <div style={{ marginTop: 4 }}>
          <RatioBar shipped={Math.round(ratio * 100)} planned={100} color={c} height={5} />
        </div>
      </div>
    );
  };

  return (
    <Panel
      title={`Context · ${lane.name}`}
      glance="5s"
      accent={color}
      right={
        <span
          className="mono"
          style={{ fontSize: 10, color: lane.daysDark > 7 ? "var(--stop)" : "var(--muted)" }}
        >
          {lane.daysDark}d dark
        </span>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 13, flex: 1 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {lane.name}
            </h3>
            <span
              className="mono"
              style={{
                fontSize: 9,
                color,
                border: `1px solid ${color}`,
                borderRadius: 3,
                padding: "1px 5px",
                letterSpacing: ".08em",
                fontWeight: 600,
              }}
            >
              {bandName(iRatio)}
            </span>
          </div>
          <div className="mono" style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 3 }}>
            {lane.blurb}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <Mini label="issues" ratio={iRatio} />
          <div style={{ width: 1, background: "var(--line-soft)" }} />
          <Mini label="mail" ratio={mRatio} />
        </div>

        <div
          style={{
            marginTop: "auto",
            padding: "11px 12px",
            borderRadius: 8,
            background: `color-mix(in oklch, ${color} 9%, var(--bg-2))`,
            border: `1px solid color-mix(in oklch, ${color} 40%, transparent)`,
          }}
        >
          <div
            className="mono"
            style={{ fontSize: 9, color, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 5 }}
          >
            the one outward step &rarr;
          </div>
          <div style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.4, textWrap: "pretty" }}>
            {lane.nextShip}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ─── WCards ─── */

function WCards({ detail, color }: { detail: LaneDetail; color: string }) {
  const doing = detail.cards.filter((c) => c.status === "doing").length;

  return (
    <Panel
      title="Active cards"
      glance="30s"
      accent="var(--flow)"
      right={
        <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
          {doing} doing &middot; {detail.cards.length} total
        </span>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(248px, 1fr))",
          gap: 10,
          flex: 1,
        }}
      >
        {detail.cards.map((c, i) => {
          const isDoing = c.status === "doing";
          const sc = isDoing ? "var(--flow)" : "var(--faint)";
          const pc = PRIO_W[c.priority] || "var(--muted)";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "11px 12px",
                background: "var(--bg-2)",
                border: "1px solid var(--line-soft)",
                borderTop: `3px solid ${sc}`,
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  className="pill"
                  style={{
                    color: sc,
                    borderColor: `color-mix(in oklch, ${sc} 40%, transparent)`,
                    padding: "1px 7px",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                  }}
                >
                  <span className="dot" style={{ background: sc }} />
                  {c.status}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: pc,
                    border: `1px solid ${pc}`,
                    borderRadius: 3,
                    padding: "0 4px",
                    letterSpacing: ".05em",
                  }}
                >
                  {c.priority}
                </span>
                <span style={{ flex: 1 }} />
                <span
                  className="mono tnum"
                  style={{ fontSize: 10, color: c.age > 14 ? "var(--stop)" : "var(--faint)" }}
                >
                  {c.age}d in lane
                </span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.25, textWrap: "pretty" }}>
                {c.title}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.45, textWrap: "pretty", flex: 1 }}>
                {c.desc}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  paddingTop: 8,
                  borderTop: "1px solid var(--line-soft)",
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 8.5, color, letterSpacing: ".08em", textTransform: "uppercase", flex: "none" }}
                >
                  next &rarr;
                </span>
                <span style={{ fontSize: 11.5, color: "var(--text)", flex: 1, minWidth: 0, lineHeight: 1.3 }}>
                  {c.next}
                </span>
                <span className="mono" style={{ fontSize: 9, color: "var(--faint)", flex: "none" }}>
                  upd {c.updated}d
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ─── WInbox ─── */

function WInbox({ detail }: { detail: LaneDetail }) {
  return (
    <Panel
      title="Inbox · owes a reply"
      glance="30s"
      accent="var(--stop)"
      right={
        <span
          className="mono"
          style={{ fontSize: 10, color: detail.inbox.length ? "var(--stop)" : "var(--go)" }}
        >
          {detail.inbox.length} urgent
        </span>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {detail.inbox.length === 0 ? (
          <div className="mono" style={{ fontSize: 11, color: "var(--go)" }}>
            &#10003; nothing waiting
          </div>
        ) : (
          detail.inbox.map((m, i) => {
            const c = ageColorW(m.days);
            return (
              <WRow key={i} accent={c}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>
                      {m.from}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: 8.5,
                        color: NEED_W[m.need],
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                      }}
                    >
                      {m.need}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-2)",
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.subject}
                  </div>
                </div>
                <div style={{ textAlign: "right", flex: "none" }}>
                  <div className="mono tnum" style={{ fontSize: 12, fontWeight: 600, color: c, lineHeight: 1 }}>
                    {m.days}d
                  </div>
                  <div className="mono" style={{ fontSize: 7.5, color: "var(--faint)" }}>
                    waiting
                  </div>
                </div>
              </WRow>
            );
          })
        )}
      </div>
    </Panel>
  );
}

/* ─── WNotes ─── */

function WNotes({ detail }: { detail: LaneDetail }) {
  return (
    <Panel
      title="Notes & links"
      glance="deep"
      accent="var(--go)"
      right={<span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>vault</span>}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {detail.notes.map((n, i) => (
          <WRow key={i}>
            <span style={{ color: "var(--flow)", fontSize: 13, flex: "none", fontFamily: "var(--mono)" }}>
              &#x29C9;
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {n.title}
              </div>
              <div className="mono" style={{ fontSize: 9, color: "var(--faint)", marginTop: 1 }}>
                updated {n.updated}d ago
              </div>
            </div>
            <span
              className="mono"
              style={{
                fontSize: 8.5,
                color: "var(--muted)",
                border: "1px solid var(--line-soft)",
                borderRadius: 3,
                padding: "1px 5px",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                flex: "none",
              }}
            >
              {n.type}
            </span>
          </WRow>
        ))}
      </div>
    </Panel>
  );
}

/* ─── WCalendar ─── */

function WCalendar({ detail }: { detail: LaneDetail }) {
  return (
    <Panel
      title="Calendar · next up"
      glance="30s"
      accent="var(--warn)"
      right={<span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>this week</span>}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {detail.events.map((e, i) => {
          const ev = EVENT_W[e.kind] || EVENT_W.meeting;
          return (
            <WRow key={i} accent={ev.c}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: "none",
                  width: 40,
                  borderRight: "1px solid var(--line-soft)",
                  paddingRight: 8,
                }}
              >
                <span className="mono" style={{ fontSize: 8, color: "var(--faint)", textTransform: "uppercase" }}>
                  {e.date.split(" ")[0]}
                </span>
                <span className="mono tnum" style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", lineHeight: 1 }}>
                  {e.date.split(" ")[1]}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.3, textWrap: "pretty" }}>
                  {e.title}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 8.5, color: ev.c, marginTop: 2, textTransform: "uppercase", letterSpacing: ".08em" }}
                >
                  {ev.label}
                </div>
              </div>
            </WRow>
          );
        })}
      </div>
    </Panel>
  );
}

/* ─── LaneWidgets (exported) ─── */

export function LaneWidgets({ laneKey }: { laneKey: string }) {
  const DASH = useDash();
  const lane = DASH.swimlanes.find((l) => l.key === laneKey) || DASH.swimlanes[0];
  const detail = DASH.laneDetail[lane.key];
  const color = bandColor(lane.shipped / lane.planned);

  return (
    <div className="lane-ws">
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 2px 11px" }}>
        <span style={{ width: 3, height: 13, borderRadius: 2, background: color, flex: "none" }} />
        <span className="kicker">Lane workspace</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text)", fontWeight: 600 }}>
          {lane.name}
        </span>
        <span className="mono" style={{ fontSize: 10, color: "var(--faint)" }}>
          &mdash; select a lane above to switch context
        </span>
      </div>
      <div key={lane.key} className="lane-ws-grid">
        <div style={{ gridArea: "ctx" }}>
          <WContext lane={lane} color={color} />
        </div>
        <div style={{ gridArea: "card" }}>
          <WCards detail={detail} color={color} />
        </div>
        <div style={{ gridArea: "mail" }}>
          <WInbox detail={detail} />
        </div>
        <div style={{ gridArea: "note" }}>
          <WNotes detail={detail} />
        </div>
        <div style={{ gridArea: "cal" }}>
          <WCalendar detail={detail} />
        </div>
      </div>
    </div>
  );
}
