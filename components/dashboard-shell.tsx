"use client";

import { useState, useEffect } from "react";
import { SwimlaneBoard } from "./swimlane-board";
import { LaneWidgets } from "./lane-widgets";
import { HeroExecution, NextAction, ProjectMomentum } from "./panels-core";
import { PlanVsShip, LeadingLagging, ReAsks, FocusLog, StalledList } from "./panels-deep";
import { UrgentEmail } from "./panels-email";
import { DashProvider, useDash, useDashMeta } from "@/lib/dash-context";

/* ─── Types ─── */

type Tone = "gentle" | "neutral" | "blunt";
type Variation = "gap" | "action" | "momentum";
type Theme = "dark" | "light" | "paper";

interface CellDef {
  k: string;
  span: number;
  big?: boolean;
}

interface LayoutDef {
  name: string;
  blurb: string;
  cells: CellDef[];
}

/* ─── Component registry ─── */

const COMPONENTS: Record<string, React.ComponentType<any>> = {
  hero: HeroExecution,
  action: NextAction,
  momentum: ProjectMomentum,
  planship: PlanVsShip,
  leadlag: LeadingLagging,
  reasks: ReAsks,
  focus: FocusLog,
  stalled: StalledList,
  email: UrgentEmail,
};

/* ─── Layout definitions ─── */

const LAYOUTS: Record<Variation, LayoutDef> = {
  gap: {
    name: "Gap-first",
    blurb: "Hero = the execution ratio itself. The gap leads; everything else explains it.",
    cells: [
      { k: "hero", span: 12, big: true },
      { k: "action", span: 6 },
      { k: "email", span: 6 },
      { k: "planship", span: 6 },
      { k: "leadlag", span: 6 },
      { k: "momentum", span: 6 },
      { k: "stalled", span: 6 },
      { k: "focus", span: 6 },
      { k: "reasks", span: 6 },
    ],
  },
  action: {
    name: "Action-first",
    blurb: "Hero = today's one committed thing. Built to end the day having shipped it.",
    cells: [
      { k: "action", span: 7, big: true },
      { k: "hero", span: 5 },
      { k: "email", span: 5 },
      { k: "stalled", span: 7 },
      { k: "momentum", span: 6 },
      { k: "leadlag", span: 6 },
      { k: "planship", span: 4 },
      { k: "focus", span: 4 },
      { k: "reasks", span: 4 },
    ],
  },
  momentum: {
    name: "Momentum-first",
    blurb: "Hero = are the projects actually moving. Surfaces dark/stalled work fastest.",
    cells: [
      { k: "momentum", span: 8 },
      { k: "hero", span: 4 },
      { k: "email", span: 6 },
      { k: "stalled", span: 6 },
      { k: "planship", span: 4 },
      { k: "leadlag", span: 4 },
      { k: "action", span: 4 },
      { k: "focus", span: 6 },
      { k: "reasks", span: 6 },
    ],
  },
};

/* ─── Segmented control ─── */

interface SegmentedOption {
  value: string;
  label: string;
  title?: string;
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SegmentedOption[];
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 3,
        gap: 2,
        background: "var(--bg-2)",
        border: "1px solid var(--line-soft)",
        borderRadius: 8,
      }}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            title={o.title}
            style={{
              padding: "6px 11px",
              borderRadius: 6,
              border: "1px solid " + (on ? "var(--line)" : "transparent"),
              background: on ? "var(--elevated)" : "transparent",
              color: on ? "var(--text)" : "var(--muted)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: ".02em",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Tone toggle ─── */

function ToneToggle({ tone, setTone }: { tone: Tone; setTone: (t: Tone) => void }) {
  return (
    <Segmented
      value={tone}
      onChange={(v) => setTone(v as Tone)}
      options={[
        { value: "gentle", label: "Gentle", title: "supportive nudges" },
        { value: "neutral", label: "Neutral", title: "just the facts" },
        { value: "blunt", label: "Blunt", title: "accountability mode" },
      ]}
    />
  );
}

/* ─── TopBar ─── */

interface TopBarProps {
  variation: Variation;
  setVariation: (v: Variation) => void;
  tone: Tone;
  setTone: (t: Tone) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

function TopBar({ variation, setVariation, tone, setTone, theme, setTheme }: TopBarProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
        padding: "14px 22px",
        borderBottom: "1px solid var(--line-soft)",
        background: "color-mix(in oklch, var(--bg) 80%, transparent)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "linear-gradient(135deg, var(--go), var(--flow))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--bg)" }} />
          </span>
          <div style={{ lineHeight: 1.1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
              Personal Productivity
            </div>
            <div
              className="mono"
              style={{ fontSize: 9.5, color: "var(--muted)", letterSpacing: ".14em", textTransform: "uppercase" }}
            >
              Execution Instrument
            </div>
          </div>
        </div>
        <div style={{ height: 30, width: 1, background: "var(--line-soft)" }} />
        <div
          className="mono"
          style={{
            fontSize: 12.5,
            color: "var(--text-2)",
            fontStyle: "italic",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          &ldquo;Am I shipping, or just planning?&rdquo;
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Segmented
          value={variation}
          onChange={(v) => setVariation(v as Variation)}
          options={[
            { value: "gap", label: "Gap" },
            { value: "action", label: "Action" },
            { value: "momentum", label: "Momentum" },
          ]}
        />
        <ToneToggle tone={tone} setTone={setTone} />
        <Segmented
          value={theme}
          onChange={(v) => setTheme(v as Theme)}
          options={[
            { value: "dark", label: "☾", title: "Dark — control room" },
            { value: "light", label: "☀", title: "Light" },
            { value: "paper", label: "▤", title: "Paper — notebook" },
          ]}
        />
      </div>
    </header>
  );
}

/* ─── Grid ─── */

interface GridProps {
  variation: Variation;
  tone: Tone;
  status: string;
  setStatus: (s: string) => void;
}

function Grid({ variation, tone, status, setStatus }: GridProps) {
  const L = LAYOUTS[variation];
  return (
    <div
      key={variation}
      className="grid-wrap"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: 14,
        padding: 18,
        alignItems: "stretch",
      }}
    >
      {L.cells.map((cell, i) => {
        const Comp = COMPONENTS[cell.k];
        const props: Record<string, any> = { tone, big: cell.big, glance: undefined };
        if (cell.k === "action") {
          props.status = status;
          props.setStatus = setStatus;
        }
        return (
          <div
            key={cell.k}
            className="cell"
            style={
              {
                gridColumn: `span ${cell.span}`,
                display: "flex",
                animationDelay: `${i * 45}ms`,
              } as React.CSSProperties
            }
          >
            <Comp {...props} />
          </div>
        );
      })}
    </div>
  );
}

/* ─── DashboardShell (exported) ─── */

export function DashboardShell() {
  return (
    <DashProvider>
      <DashboardShellInner />
    </DashProvider>
  );
}

function DashboardShellInner() {
  const DASH = useDash();
  const { refresh, lastRefresh, isLive, loading } = useDashMeta();
  const [variation, setVariation] = useState<Variation>("gap");
  const [tone, setTone] = useState<Tone>("blunt");
  const [theme, setTheme] = useState<Theme>("paper");
  const [status, setStatus] = useState<string>(DASH.today.status);
  const [lane, setLane] = useState<string>("anuba");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const footerLabel = isLive
    ? `LIVE${lastRefresh ? ` · refreshed ${lastRefresh.toLocaleTimeString()}` : ""}`
    : "SAMPLE DATA · illustrative";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar
        variation={variation}
        setVariation={setVariation}
        tone={tone}
        setTone={setTone}
        theme={theme}
        setTheme={setTheme}
      />
      <main style={{ flex: 1, maxWidth: 1480, width: "100%", margin: "0 auto" }}>
        <div style={{ padding: "18px 18px 14px" }}>
          <SwimlaneBoard tone={tone} selected={lane} onSelect={setLane} />
        </div>
        <LaneWidgets laneKey={lane} />
        <Grid variation={variation} tone={tone} status={status} setStatus={setStatus} />
      </main>
      <footer
        style={{
          padding: "12px 22px",
          borderTop: "1px solid var(--line-soft)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 10, color: isLive ? "var(--go)" : "var(--faint)", letterSpacing: ".04em" }}>
            {footerLabel}
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              all: "unset",
              cursor: loading ? "wait" : "pointer",
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "var(--muted)",
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid var(--line-soft)",
              opacity: loading ? 0.5 : 1,
            }}
          >
            ↻ refresh
          </button>
        </div>
        <span className="mono" style={{ fontSize: 10, color: "var(--faint)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} &middot; {LAYOUTS[variation].name}
        </span>
      </footer>
    </div>
  );
}
