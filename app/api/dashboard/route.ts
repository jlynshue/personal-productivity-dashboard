import { NextResponse } from "next/server";
import { DASH } from "@/lib/data";
import { isLocal } from "@/lib/config";
import { buildFromTasks } from "@/lib/transformers/tasks";
import { computeExecution } from "@/lib/transformers/execution";
import { loadNotes } from "@/lib/transformers/notes";
import { loadReAsks } from "@/lib/transformers/re-asks";
import { loadEmail } from "@/lib/transformers/email";
import { loadCalendar } from "@/lib/transformers/calendar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!isLocal()) {
    return NextResponse.json(DASH);
  }

  try {
    const { swimlanes, laneDetail, projects, stalled, ops } =
      await buildFromTasks();
    const execution = await computeExecution();
    const email = await loadEmail();
    const calendar = await loadCalendar();
    const notes = await loadNotes();
    const reAsks = await loadReAsks();

    // Merge email mail counts into swimlanes
    for (const lane of swimlanes) {
      const acct = email.accounts.find((a) => a.lane === lane.key);
      if (acct) {
        lane.mail = {
          unread: acct.unread,
          drafted: 0,
          sent: 0,
        };
      }
    }

    // Merge calendar + notes into laneDetail
    for (const key of Object.keys(laneDetail)) {
      laneDetail[key].events = calendar[key] || [];
      laneDetail[key].notes = notes[key] || [];
      const acct = email.accounts.find((a) => a.lane === key);
      if (acct) {
        laneDetail[key].inbox = acct.urgent.map((u) => ({
          from: u.from,
          subject: u.subject,
          days: u.days,
          need: u.need,
        }));
      }
    }

    const indicators = DASH.indicators; // keep static until we derive from real metrics
    const focus = DASH.focus; // keep static until time-tracking integration
    const today = DASH.today; // keep static until today.json exists

    const data = {
      _live: true,
      TODAY: new Date().toISOString().split("T")[0],
      execution,
      today,
      projects,
      indicators,
      reAsks,
      focus,
      stalled,
      swimlanes,
      ops,
      email,
      laneDetail,
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("Dashboard data error:", err);
    return NextResponse.json(DASH);
  }
}
