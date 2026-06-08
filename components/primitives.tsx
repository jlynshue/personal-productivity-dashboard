"use client";

import { useState, useEffect, useRef, ReactNode, CSSProperties } from "react";

export function bandColor(ratio: number): string {
  if (ratio < 0.25) return "var(--stop)";
  if (ratio < 0.5) return "var(--warn)";
  return "var(--go)";
}

export function bandName(ratio: number): string {
  if (ratio < 0.25) return "RED";
  if (ratio < 0.5) return "AMBER";
  return "GREEN";
}

export const STATUS: Record<string, { c: string; label: string }> = {
  moving: { c: "var(--go)", label: "moving" },
  stalled: { c: "var(--warn)", label: "stalled" },
  avoiding: { c: "var(--stop)", label: "avoiding" },
};

interface PanelProps {
  title: string;
  glance?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  accent?: string;
}

export function Panel({ title, glance, right, children, className = "", style, accent }: PanelProps) {
  return (
    <section className={`panel rise ${className}`} style={{ display: "flex", flexDirection: "column", ...style }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 16px 11px", borderBottom: "1px solid var(--line-soft)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, flex: "1 1 auto" }}>
          {accent && <span style={{ width: 3, height: 13, borderRadius: 2, background: accent, flex: "none" }} />}
          <span className="kicker" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
          {right}
          {glance && <span className="glance">{glance}</span>}
        </div>
      </header>
      <div style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{children}</div>
    </section>
  );
}

interface SparkProps {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
  fill?: boolean;
}

export function Spark({ data, color = "var(--flow)", w = 64, h = 20, fill = false }: SparkProps) {
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 3) - 1.5;
    return [x, y] as [number, number];
  });
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = d + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      {fill && <path d={area} fill={color} opacity="0.12" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={color} />
    </svg>
  );
}

export function useCountUp(target: number, ms = 800): number {
  const [v, setV] = useState(target);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf: number;
    const safety = setTimeout(() => { setV(target); fromRef.current = target; }, ms + 120);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      setV(from + (target - from) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
      else { fromRef.current = target; clearTimeout(safety); }
    };
    setV(from);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); };
  }, [target, ms]);
  return v;
}

interface RatioBarProps {
  shipped: number;
  planned: number;
  color: string;
  height?: number;
}

export function RatioBar({ shipped, planned, color, height = 12 }: RatioBarProps) {
  const pct = Math.max(0, Math.min(1, shipped / planned));
  return (
    <div style={{ position: "relative", height, borderRadius: 999, background: "var(--panel-2)", border: "1px solid var(--line-soft)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, width: `${pct * 100}%`, background: color, borderRadius: 999, transition: "width .8s cubic-bezier(.2,.7,.2,1)" }} />
    </div>
  );
}

interface PlanShipBarsProps {
  weeks: { planned: number; shipped: number; w: string }[];
  height?: number;
}

export function PlanShipBars({ weeks, height = 92 }: PlanShipBarsProps) {
  const max = Math.max(...weeks.map(w => Math.max(w.planned, w.shipped)));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height, width: "100%" }}>
      {weeks.map((w, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", gap: 3 }}>
          <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "flex-end", gap: 2 }}>
            <div title={`planned ${w.planned}`} style={{ flex: 1, height: `${(w.planned / max) * 100}%`, background: "var(--warn-dim)", borderRadius: "2px 2px 0 0", minHeight: 2 }} />
            <div title={`shipped ${w.shipped}`} style={{ flex: 1, height: `${(w.shipped / max) * 100}%`, background: "var(--go)", borderRadius: "2px 2px 0 0", minHeight: 2 }} />
          </div>
          <div className="mono" style={{ fontSize: 8, color: "var(--faint)", textAlign: "center", letterSpacing: ".02em" }}>{w.w.replace("W", "")}</div>
        </div>
      ))}
    </div>
  );
}

interface GaugeProps {
  value: number;
  color: string;
  size?: number;
  label: string;
  sub?: string;
}

export function Gauge({ value, color, size = 96, label, sub }: GaugeProps) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value);
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="mono tnum" style={{ fontSize: 19, fontWeight: 600, color: "var(--text)" }}>{label}</span>
        {sub && <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)", letterSpacing: ".08em", marginTop: 1 }}>{sub}</span>}
      </div>
    </div>
  );
}

export function BandLegend({ ratio }: { ratio: number }) {
  const bands = [
    { n: "RED", c: "var(--stop)", r: "< 25%" },
    { n: "AMBER", c: "var(--warn)", r: "25–50%" },
    { n: "GREEN", c: "var(--go)", r: "≥ 50%" },
  ];
  const active = bandName(ratio);
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {bands.map(b => (
        <div key={b.n} style={{ display: "flex", alignItems: "center", gap: 5, opacity: active === b.n ? 1 : 0.4 }}>
          <span className="dot" style={{ background: b.c }} />
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: ".06em" }}>{b.r}</span>
        </div>
      ))}
    </div>
  );
}
