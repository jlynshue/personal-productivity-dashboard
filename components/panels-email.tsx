"use client";

import { useState } from "react";
import { Panel } from "@/components/primitives";
import { DASH, EmailItem, EmailAccount } from "@/lib/data";

type Tone = "gentle" | "neutral" | "blunt";

function ageColor(days: number): string {
  if (days > 7) return "var(--stop)";
  if (days >= 3) return "var(--warn)";
  return "var(--flow)";
}

const NEED_META: Record<string, { label: string; c: string }> = {
  reply: { label: "reply", c: "var(--flow)" },
  send: { label: "send", c: "var(--stop)" },
  decide: { label: "decide", c: "var(--warn)" },
};

function EmailRow({ m, onClear }: { m: EmailItem; onClear: () => void }) {
  const c = ageColor(m.days);
  const need = NEED_META[m.need] || NEED_META.reply;
  return (
    <div className="rise" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
      background: "var(--bg-2)", border: "1px solid var(--line-soft)", borderLeft: `3px solid ${c}`, borderRadius: 7 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>{m.from}</span>
          <span className="pill" style={{ color: need.c, borderColor: need.c.replace(")", " / 0.4)").replace("var(--", "oklch("), padding: "1px 6px", fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase" }}>{need.label}</span>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}>{m.subject}</div>
      </div>
      <div style={{ textAlign: "right", flex: "none" }}>
        <div className="mono tnum" style={{ fontSize: 13, fontWeight: 600, color: c, lineHeight: 1 }}>{m.days}d</div>
        <div className="mono" style={{ fontSize: 8, color: "var(--faint)", letterSpacing: ".06em" }}>waiting</div>
      </div>
      <button onClick={onClear} className="pill" title="Mark handled"
        style={{ color: "var(--go)", borderColor: "var(--go-dim)", background: "transparent", flex: "none" }}>{"✓"} sent</button>
    </div>
  );
}

export function UrgentEmail({ tone, glance = "30s" }: { tone: Tone; glance?: string }) {
  const [accts, setAccts] = useState<EmailAccount[]>(DASH.email.accounts);
  const clear = (aid: string, idx: number) => setAccts(a => a.map(ac =>
    ac.id === aid ? { ...ac, urgent: ac.urgent.filter((_, i) => i !== idx) } : ac));

  const total = accts.reduce((n, a) => n + a.urgent.length, 0);
  const oldest = accts.flatMap(a => a.urgent).reduce((m, x) => Math.max(m, x.days), 0);

  const head = tone === "blunt" ? "These people are waiting on you."
    : tone === "gentle" ? "A few replies would close some open loops."
    : "Urgent · waiting on a reply from you";

  return (
    <Panel title="Urgent Email · by account" glance={glance} accent="var(--stop)"
      right={<span className="mono" style={{ fontSize: 10, color: total ? "var(--stop)" : "var(--go)" }}>{total} urgent · oldest {oldest}d</span>}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
        <div className="kicker" style={{ color: total ? "var(--stop)" : "var(--go)" }}>{total ? head : "Inbox zero on urgent — nothing is waiting."}</div>
        {accts.map(a => {
          const worst = a.urgent.reduce((m, x) => Math.max(m, x.days), 0);
          const dot = a.urgent.length ? ageColor(worst) : "var(--go)";
          return (
            <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span className="dot" style={{ background: dot, boxShadow: a.urgent.length ? `0 0 7px ${dot}` : "none", flex: "none" }} />
                <span className="mono" style={{ fontSize: 11, color: "var(--text)", fontWeight: 500 }}>{a.label}</span>
                <span style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
                <span className="mono" style={{ fontSize: 9.5, color: "var(--faint)" }}>{a.urgent.length} urgent · {a.unread} unread</span>
              </div>
              {a.urgent.length === 0
                ? <div className="mono" style={{ fontSize: 10.5, color: "var(--go)", paddingLeft: 16 }}>{"✓"} cleared</div>
                : a.urgent.map((m, i) => <EmailRow key={i} m={m} onClear={() => clear(a.id, i)} />)}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
