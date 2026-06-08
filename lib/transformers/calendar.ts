import { readFile } from "fs/promises";
import { join } from "path";
import { PATHS } from "@/lib/config";
import type { EventItem } from "@/lib/data";

export async function loadCalendar(): Promise<Record<string, EventItem[]>> {
  try {
    const raw = await readFile(
      join(PATHS.dashLive, "calendar.json"),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
