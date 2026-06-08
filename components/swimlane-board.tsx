"use client";

import { bandColor, bandName, RatioBar } from "@/components/primitives";
import { DASH, Swimlane } from "@/lib/data";

type Tone = "gentle" | "neutral" | "blunt";

interface ColCellProps {
  n: number;
  label: string;
  c: string;
  dim?: boolean;
}

/* small status-column cell */
function ColCell({ n, label, c, dim }: ColCellProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: 42 }}>
      <span className="mono tnum" style={{ fontSize: 15, fontWeight: 600, color: dim ? "var(--faint)" : c, lineHeight: 1 }}>{n}</span>
      <span className="mono" style={{ fontSize: 7.5, color: "var(--faint)", letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

interface TripletItem {
  n: number;
  label: string;
  c: string;
  dim?: boolean;
}

interface MeasureLineProps {
  kind: string;
  triplet: TripletItem[];
  shipped: number;
  planned: number;
}

/* one measure line: label + triplet + execution ratio */
function MeasureLine({ kind, triplet, shipped, planned }: MeasureLineProps) {
  const ratio = planned ? shipped / planned : 0;
  const color = bandColor(ratio);
  const pct = Math.round(ratio * 100);
  return (
    <div className="measure-line" style={{ display: "grid", gridTemplateColumns: "44px 150px minmax(108px, 1fr)", alignItems: "center", gap: 12 }}>
      <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)", letterSpacing: ".1em", textTransform: "uppercase" }}>{kind}</span>
      <div style={{ display: "flex", gap: 12 }}>
        {triplet.map((t, i) => <ColCell key={i} n={t.n} label={t.label} c={t.c} dim={t.dim} />)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span className="mono tnum" style={{ fontSize: 17, fontWeight: 600, color, lineHeight: 1 }}>{pct}<span style={{ fontSize: 10, color: "var(--text-2)" }}>%</span></span>
          <span className="mono tnum" style={{ fontSize: 9.5, color: "var(--faint)" }}>{shipped}/{planned}</span>
        </div>
        <RatioBar shipped={shipped} planned={planned} color={color} height={6} />
      </div>
    </div>
  );
}

interface LaneRowProps {
  lane: Swimlane;
  i: number;
  open: boolean;
  onToggle: () => void;
  tone: Tone;
}

/* one major lane row -- issues + mail measures */
function LaneRow({ lane, i, open, onToggle, tone }: LaneRowProps) {
  const ratio = lane.shipped / lane.planned;
  const color = bandColor(ratio);
  const band = bandName(ratio);
  const darkC = lane.daysDark > 7 ? "var(--stop)" : lane.daysDark > 3 ? "var(--warn)" : "var(--go)";
  const m = lane.mail || { unread: 0, drafted: 0, sent: 0 };
  const mailTotal = m.unread + m.drafted + m.sent;

  return (
    <div className="lane-row rise" style={{ animationDelay: (i * 55 + 60) + "ms" }}>
      <button onClick={onToggle}
        style={{ all: "unset", cursor: "pointer", display: "grid",
          gridTemplateColumns: "var(--lane-cols)", alignItems: "center", gap: 16,
          padding: "12px 16px", width: "100%", boxSizing: "border-box",
          borderLeft: `3px solid ${color}`,
          background: open ? `color-mix(in oklch, ${color} 7%, var(--bg-2))` : "transparent",
          transition: "background .2s" }}>

        {/* name */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <span className="mono tnum" style={{ fontSize: 11, color: "var(--faint)", width: 14, flex: "none" }}>{i + 1}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{lane.name}</span>
              <span className="mono" style={{ fontSize: 9, color: color, border: `1px solid ${color}`, opacity: 0.85, borderRadius: 3, padding: "1px 5px", letterSpacing: ".08em", fontWeight: 600 }}>{band}</span>
            </div>
            <div className="mono" style={{ fontSize: 9.5, color: "var(--faint)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lane.blurb}</div>
          </div>
        </div>

        {/* two stacked measures: issues + mail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <MeasureLine kind="issues"
            triplet={[
              { n: lane.backlog, label: "backlog", c: "var(--text-2)", dim: true },
              { n: lane.doing,   label: "doing",   c: "var(--flow)" },
              { n: lane.shipped, label: "shipped", c: "var(--go)" },
            ]}
            shipped={lane.shipped} planned={lane.planned} />
          <div style={{ borderTop: "1px dashed var(--line-soft)" }} />
          <MeasureLine kind="mail"
            triplet={[
              { n: m.unread,  label: "unread",  c: "var(--text-2)", dim: true },
              { n: m.drafted, label: "drafted", c: "var(--warn)" },
              { n: m.sent,    label: "sent",    c: "var(--go)" },
            ]}
            shipped={m.sent} planned={mailTotal} />
        </div>

        {/* days dark */}
        <div style={{ textAlign: "right", flex: "none" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
            <span className="mono tnum" style={{ fontSize: 20, fontWeight: 600, color: darkC, lineHeight: 1 }}>{lane.daysDark}</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>d</span>
          </div>
          <div className="mono" style={{ fontSize: 8, color: "var(--faint)", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 1 }}>dark</div>
        </div>
      </button>

      {/* selected -- points to the workspace strip below */}
      {open && (
        <div className="rise" style={{ padding: "0 16px 11px 33px", display: "flex", alignItems: "center", gap: 9 }}>
          <span className="mono" style={{ fontSize: 9.5, color, letterSpacing: ".1em", textTransform: "uppercase", flex: "none" }}>&#9662; workspace</span>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>context · cards · inbox · notes · calendar below</span>
        </div>
      )}
    </div>
  );
}

/* the quiet rolled-up minor strip */
function OpsStrip() {
  const o = DASH.ops;
  return (
    <div className="rise" style={{ animationDelay: "400ms", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      padding: "11px 16px", borderTop: "1px solid var(--line-soft)", background: "color-mix(in oklch, var(--bg) 50%, transparent)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
        <span className="kicker" style={{ color: "var(--faint)" }}>Ops &amp; Infra</span>
        <div style={{ display: "flex", gap: 5 }}>
          {o.lanes.map((l) => <span key={l} className="mono" style={{ fontSize: 9.5, color: "var(--muted)", border: "1px solid var(--line-soft)", borderRadius: 3, padding: "1px 6px" }}>{l}</span>)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
        <span className="mono tnum" style={{ fontSize: 12, color: "var(--text-2)" }}>{o.open}<span style={{ color: "var(--faint)", marginLeft: 4 }}>open</span></span>
        <span className="mono tnum" style={{ fontSize: 12, color: o.blockers ? "var(--stop)" : "var(--go)" }}>{o.blockers}<span style={{ color: "var(--faint)", marginLeft: 4 }}>blockers</span></span>
      </div>
      <div style={{ flex: "1 1 240px", minWidth: 0, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {o.items.filter((it) => it.blocker).map((it, k) => (
          <span key={k} className="mono" style={{ fontSize: 10, color: "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <span className="dot" style={{ background: "var(--stop)" }} />{it.lane}: {it.note}
          </span>
        ))}
      </div>
    </div>
  );
}

interface SwimlaneBoardProps {
  tone: Tone;
  selected: string | null;
  onSelect: (key: string) => void;
}

/* THE TOPLINE BOARD */
export function SwimlaneBoard({ tone, selected, onSelect }: SwimlaneBoardProps) {
  const lanes = DASH.swimlanes;
  const o = DASH.ops;
  const totPlan = lanes.reduce((a, l) => a + l.planned, 0) + o.planned;
  const totShip = lanes.reduce((a, l) => a + l.shipped, 0) + o.shipped;
  const gRatio = totShip / totPlan;
  const gColor = bandColor(gRatio);
  const worst = [...lanes].sort((a, b) => (a.shipped / a.planned) - (b.shipped / b.planned))[0];

  const head = tone === "blunt" ? "Five lanes. This is where the work actually lives."
            : tone === "gentle" ? "Your five lanes — at a glance, where is output reaching the world?"
            : "Execution by stream · five major lanes";

  return (
    <section className="panel rise" style={{ display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "14px 16px 12px", borderBottom: "1px solid var(--line-soft)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <span style={{ width: 3, height: 14, borderRadius: 2, background: gColor, flex: "none" }} />
          <span className="kicker" style={{ whiteSpace: "nowrap" }}>Swimlanes · topline</span>
          <span className="glance">5s</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-2)", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{head}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 8.5, color: "var(--faint)", letterSpacing: ".12em", textTransform: "uppercase" }}>all lanes</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, justifyContent: "flex-end" }}>
              <span className="mono tnum" style={{ fontSize: 22, fontWeight: 600, color: gColor, lineHeight: 1 }}>{Math.round(gRatio * 100)}%</span>
              <span className="mono tnum" style={{ fontSize: 10.5, color: "var(--faint)" }}>{totShip}/{totPlan}</span>
            </div>
          </div>
          <div style={{ height: 30, width: 1, background: "var(--line-soft)" }} />
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 8.5, color: "var(--faint)", letterSpacing: ".12em", textTransform: "uppercase" }}>darkest lane</div>
            <div className="mono" style={{ fontSize: 12.5, color: "var(--stop)", fontWeight: 600 }}>{worst.name} · {worst.daysDark}d</div>
          </div>
        </div>
      </header>

      <div className="lane-head" style={{ display: "grid", gridTemplateColumns: "var(--lane-cols)", gap: 16, padding: "7px 16px 7px 19px", borderBottom: "1px solid var(--line-soft)" }}>
        <span className="mono" style={{ fontSize: 8.5, color: "var(--faint)", letterSpacing: ".1em", textTransform: "uppercase" }}>lane</span>
        <span className="mono" style={{ fontSize: 8.5, color: "var(--faint)", letterSpacing: ".1em", textTransform: "uppercase" }}>issues + mail · status columns → execution ratio</span>
        <span className="mono" style={{ fontSize: 8.5, color: "var(--faint)", letterSpacing: ".1em", textTransform: "uppercase", textAlign: "right" }}>days dark</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {lanes.map((lane, i) => (
          <div key={lane.key} style={{ borderBottom: i < lanes.length - 1 ? "1px solid var(--line-soft)" : "none" }}>
            <LaneRow lane={lane} i={i} tone={tone}
              open={selected === lane.key}
              onToggle={() => onSelect(lane.key)} />
          </div>
        ))}
      </div>

      <OpsStrip />
    </section>
  );
}
