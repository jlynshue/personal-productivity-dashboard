import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { PATHS } from "@/lib/config";
import type { Execution, WeekData } from "@/lib/data";

interface DoneCard {
  title: string;
  modified: string;
  stream: string;
}

function getISOWeek(date: Date): string {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 -
      3 +
      ((week1.getDay() + 6) % 7)) /
      7 +
      1
  );
  return `W${weekNum}`;
}

async function parseDoneCards(): Promise<DoneCard[]> {
  const cards: DoneCard[] = [];
  try {
    const files = await readdir(PATHS.vaultSprint);
    for (const f of files) {
      if (!f.endsWith(".md") || f.startsWith("_")) continue;
      const content = await readFile(join(PATHS.vaultSprint, f), "utf-8");
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) continue;
      const fm = fmMatch[1];
      if (!/^status:\s*done\s*$/m.test(fm)) continue;
      const modMatch = fm.match(/^modified:\s*"?(.+?)"?\s*$/m);
      const streamMatch = fm.match(/^stream:\s*(.+?)\s*$/m);
      const titleMatch = fm.match(/^title:\s*"?(.+?)"?\s*$/m);
      cards.push({
        title:
          titleMatch?.[1] || f.replace(".md", "").replace(/^[a-z]+-/, ""),
        modified: modMatch?.[1]?.split(" ")[0] || "2026-01-01",
        stream: streamMatch?.[1] || "",
      });
    }
  } catch {
    // vault not accessible
  }
  return cards;
}

async function parseSprintLogs(): Promise<
  { card: string; date: string; week: string }[]
> {
  const ships: { card: string; date: string; week: string }[] = [];
  try {
    const files = await readdir(PATHS.vaultSprint);
    const logFiles = files.filter((f) => f.startsWith("_sprint-log-"));
    for (const f of logFiles) {
      const content = await readFile(join(PATHS.vaultSprint, f), "utf-8");
      let currentDate = "";
      for (const line of content.split("\n")) {
        const dateMatch = line.match(/^## (\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          currentDate = dateMatch[1];
          continue;
        }
        const doneMatch = line.match(
          /- \[[\d:]+\] (.+?):\s*.+?->\s*done/
        );
        if (doneMatch && currentDate) {
          ships.push({
            card: doneMatch[1],
            date: currentDate,
            week: getISOWeek(new Date(currentDate)),
          });
        }
      }
    }
  } catch {
    // logs not accessible
  }
  return ships;
}

export async function computeExecution(): Promise<Execution> {
  const doneCards = await parseDoneCards();
  const logShips = await parseSprintLogs();

  // Combine ship events (dedup by card name)
  const shipMap = new Map<string, string>();
  for (const card of doneCards) {
    shipMap.set(card.title, card.modified);
  }
  for (const s of logShips) {
    if (!shipMap.has(s.card)) shipMap.set(s.card, s.date);
  }

  const allShips = Array.from(shipMap.entries()).map(([title, date]) => ({
    title,
    date,
  }));
  allShips.sort((a, b) => b.date.localeCompare(a.date));

  // Build 10-week window
  const now = new Date();
  const weeks: WeekData[] = [];
  for (let i = 9; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - i * 7 * 86400000);
    const weekLabel = getISOWeek(weekStart);
    const shipped = allShips.filter((s) => {
      const d = new Date(s.date);
      const diff = Math.abs(
        (weekStart.getTime() - d.getTime()) / 86400000
      );
      return diff < 7 && getISOWeek(d) === weekLabel;
    }).length;
    // planned = shipped + estimated unshipped (use total active tasks / 10 as baseline)
    weeks.push({ w: weekLabel, planned: Math.max(shipped + 2, 4), shipped });
  }

  const totalShipped = allShips.length;
  const totalPlanned = weeks.reduce((a, w) => a + w.planned, 0);
  const ratio = totalPlanned > 0 ? totalShipped / totalPlanned : 0;

  const lastShipDate = allShips[0]?.date;
  const daysSinceLastShip = lastShipDate
    ? Math.floor(
        (Date.now() - new Date(lastShipDate).getTime()) / 86400000
      )
    : 99;

  return {
    window: "10w",
    planned: totalPlanned,
    shipped: totalShipped,
    ratio: Math.min(ratio, 1),
    daysSinceLastShip,
    lastShip: allShips[0]?.title || "Unknown",
    weeks,
  };
}
