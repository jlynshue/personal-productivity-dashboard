"use client";

import { useState } from "react";
import { Panel, Spark, PlanShipBars, Gauge } from "@/components/primitives";
import { DASH, ReAsk, StalledItem, FocusSegment } from "@/lib/data";

type Tone = "gentle" | "neutral" | "blunt";

function Stat({ v, k, c }: { v: string; k: string; c: string }) {
  return (
    <div style={{ padding: "6px 9px", background: "var(--bg-2)", borderRadius: 7, border: "1px solid var(--line-soft)" }}>
      <div className="mono tnum" style={{ fontSize: 16, fontWeight: 600, color: c }}>{v}</div>
      <div className="mono" style={{ fontSize: 8.5, color: "var(--faint)", letterSpacing: ".06em", textTransform: "uppercase" }}>{k}</div>
    </div>
  );
}

interface IndicatorRowProps {
  ind: {
    id: string;
    label: string;
    unit: string;
    value: number;
    target: string;
    good: boolean;
    spark: number[];
  };
}

function IndicatorRow({ ind }: IndicatorRowProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
      <span className="dot" style={{ background: ind.good ? "var(--go)" : "var(--warn)", flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ind.label}</div>
      </div>
      <Spark data={ind.spark} color={ind.good ? "var(--go)" : "var(--warn)"} w={42} h={15} />
      <div style={{ textAlign: "right", flex: "none", minWidth: 56 }}>
        <span className="mono tnum" style={{ fontSize: 14, fontWeight: 600, color: ind.good ? "var(--text)" : "var(--warn)" }}>{ind.value}</span>
        <span className="mono" style={{ fontSize: 9, color: "var(--faint)", marginLeft: 3 }}>{ind.unit}</span>
        {ind.target !== "—" && <div className="mono" style={{ fontSize: 8.5, color: "var(--faint)" }}>target {ind.target}</div>}
      </div>
    </div>
  );
}

export function PlanVsShip({ glance = "30s" }: { glance?: string }) {
  const ex = DASH.execution;
  const totPlan = ex.weeks.reduce((a, w) => a + w.planned, 0);
  const totShip = ex.weeks.reduce((a, w) => a + w.shipped, 0);
  const gap = totPlan - totShip;
  return (
    <Panel title="Plan vs Ship · the gap" glance={glance} accent="var(--warn)"
      right={<div style={{ display: "flex", gap: 11 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span className="dot" style={{ background: "var(--warn-dim)" }} /><span className="mono" style={{ fontSize: 9.5, color: "var(--muted)" }}>planned</span></span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span className="dot" style={{ background: "var(--go)" }} /><span className="mono" style={{ fontSize: 9.5, color: "var(--muted)" }}>shipped</span></span>
      </div>}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
        <PlanShipBars weeks={ex.weeks} height={96} />
        <div style={{ display: "flex", gap: 9 }}>
          <div style={{ flex: 1, padding: "9px 11px", background: "var(--bg-2)", borderRadius: 8, border: "1px solid var(--line-soft)" }}>
            <div className="kicker">Backlog of unshipped plans · 10w</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 4 }}>
              <span className="mono tnum" style={{ fontSize: 26, fontWeight: 600, color: "var(--warn)" }}>{gap}</span>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>planned · not shipped</span>
            </div>
          </div>
          <div style={{ flex: "0 0 auto", padding: "9px 11px", background: "var(--bg-2)", borderRadius: 8, border: "1px solid var(--line-soft)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="mono tnum" style={{ fontSize: 14, color: "var(--text-2)" }}>{totShip}<span style={{ color: "var(--faint)" }}>/{totPlan}</span></div>
            <div className="mono" style={{ fontSize: 9, color: "var(--faint)", letterSpacing: ".06em" }}>SHIP RATE</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function LeadingLagging({ glance = "30s" }: { glance?: string }) {
  const ind = DASH.indicators;
  return (
    <Panel title="Leading vs Lagging" glance={glance} accent="var(--go)">
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
        <div className="mono" style={{ fontSize: 9.5, color: "var(--go)", letterSpacing: ".12em", display: "flex", justifyContent: "space-between" }}>
          <span>LEADING · you control these</span><span style={{ color: "var(--faint)" }}>precede shipping</span>
        </div>
        <div style={{ borderBottom: "1px solid var(--line-soft)", paddingBottom: 4 }}>
          {ind.leading.map(i => <IndicatorRow key={i.id} ind={i} />)}
        </div>
        <div className="mono" style={{ fontSize: 9.5, color: "var(--warn)", letterSpacing: ".12em", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
          <span>LAGGING · outcomes</span><span style={{ color: "var(--faint)" }}>the ships themselves</span>
        </div>
        <div>
          {ind.lagging.map(i => <IndicatorRow key={i.id} ind={i} />)}
        </div>
      </div>
    </Panel>
  );
}

export function ReAsks({ glance = "deep" }: { glance?: string }) {
  const [items, setItems] = useState<ReAsk[]>(DASH.reAsks);
  const promote = (id: number) => setItems(x => x.map(i => i.id === id ? { ...i, promoted: true } : i));
  const sorted = [...items].sort((a, b) => b.count - a.count);
  return (
    <Panel title="Recurring Re-asks → candidate panels" glance={glance} accent="var(--flow)"
      right={<span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>re-derivable info</span>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
        {sorted.map(i => (
          <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--bg-2)", border: "1px solid var(--line-soft)", borderRadius: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none", width: 34 }}>
              <span className="mono tnum" style={{ fontSize: 16, fontWeight: 600, color: i.count > 20 ? "var(--stop)" : "var(--warn)" }}>{i.count}</span>
              <span className="mono" style={{ fontSize: 8, color: "var(--faint)" }}>×asked</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.3, textWrap: "pretty" }}>{i.q}</div>
              <div className="mono" style={{ fontSize: 9.5, color: "var(--faint)", marginTop: 2 }}>{i.source}</div>
            </div>
            {i.promoted
              ? <span className="pill" style={{ color: "var(--go)", borderColor: "var(--go-dim)", flex: "none" }}><span className="dot" style={{ background: "var(--go)" }} />panel</span>
              : <button onClick={() => promote(i.id)} className="pill" style={{ color: "var(--flow)", borderColor: "var(--flow-dim)", flex: "none", background: "transparent" }}>+ make panel</button>}
          </div>
        ))}
      </div>
    </Panel>
  );
}

const SEG: Record<FocusSegment["type"], string> = {
  deep: "var(--go)",
  shallow: "var(--flow)",
  switch: "var(--stop)",
  break: "var(--faint)",
};

export function FocusLog({ glance = "deep" }: { glance?: string }) {
  const f = DASH.focus;
  const total = f.timeline.reduce((a, s) => a + s.len, 0);
  return (
    <Panel title="Focus · context-switch log · today" glance={glance} accent="var(--stop)"
      right={<span className="mono" style={{ fontSize: 10, color: f.fragmentationScore > 0.5 ? "var(--stop)" : "var(--go)" }}>{f.switchesToday} switches</span>}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Gauge value={f.fragmentationScore} color={f.fragmentationScore > 0.5 ? "var(--stop)" : "var(--go)"} size={86}
            label={Math.round(f.fragmentationScore * 100) + ""} sub="FRAG" />
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            <Stat v={f.deepMinutes + "m"} k="deep work" c="var(--go)" />
            <Stat v={f.shallowMinutes + "m"} k="shallow" c="var(--flow)" />
            <Stat v={f.longestBlock + "m"} k="longest block" c="var(--text-2)" />
            <Stat v={f.switchesToday.toString()} k="switches" c="var(--stop)" />
          </div>
        </div>
        <div>
          <div style={{ display: "flex", height: 22, borderRadius: 6, overflow: "hidden", border: "1px solid var(--line-soft)" }}>
            {f.timeline.map((s, i) => (
              <div key={i} title={`${s.t} · ${s.label} (${s.len}m)`} style={{ width: `${(s.len / total) * 100}%`, background: SEG[s.type], opacity: s.type === "switch" ? 0.95 : 0.62, borderRight: "1px solid var(--bg)" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <span className="mono" style={{ fontSize: 9, color: "var(--faint)" }}>{f.timeline[0].t}</span>
            <div style={{ display: "flex", gap: 9 }}>
              {(Object.entries(SEG) as [FocusSegment["type"], string][]).map(([k, c]) => <span key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="dot" style={{ background: c }} /><span className="mono" style={{ fontSize: 8.5, color: "var(--faint)" }}>{k}</span></span>)}
            </div>
            <span className="mono" style={{ fontSize: 9, color: "var(--faint)" }}>now</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function StalledList({ tone, glance = "deep" }: { tone: Tone; glance?: string }) {
  const [items, setItems] = useState<StalledItem[]>(DASH.stalled);
  const act = (id: string) => setItems(x => x.filter(i => i.id !== id));
  const head = tone === "blunt" ? "You are avoiding these"
    : tone === "gentle" ? "Gently — these are waiting for you"
    : "Stalled & avoiding";
  return (
    <Panel title="Stalled & Avoiding" glance={glance} accent="var(--stop)"
      right={<span className="mono" style={{ fontSize: 10, color: "var(--stop)" }}>{items.length} stuck</span>}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div className="kicker" style={{ color: "var(--stop)", marginBottom: 9 }}>{head}</div>
        {items.length === 0 ? (
          <div className="rise" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--go)", textAlign: "center" }}>
            <span className="mono" style={{ fontSize: 22 }}>{"✓"}</span>
            <span style={{ fontSize: 13 }}>Nothing stalled. Rare. Go ship something new.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {items.map(i => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: "color-mix(in oklch, var(--stop) 7%, var(--bg-2))", border: "1px solid var(--stop-dim)", borderRadius: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</span>
                    <span className="mono" style={{ fontSize: 9.5, color: "var(--stop)", flex: "none", whiteSpace: "nowrap" }}>{i.days}d stuck</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 4, lineHeight: 1.4, textWrap: "pretty" }}>{"→"} {i.nextStep}</div>
                </div>
                <button onClick={() => act(i.id)} className="pill" style={{ color: "var(--go)", borderColor: "var(--go-dim)", flex: "none", background: "transparent" }}>did it</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
