import { readdir, stat, readFile } from "fs/promises";
import { join } from "path";
import { PATHS } from "@/lib/config";
import type { NoteItem } from "@/lib/data";

const LANE_KEYS = ["anuba", "career", "consulting", "finance", "personal"];

async function scanDir(
  dir: string,
  prefix: string
): Promise<{ file: string; mtime: number; title: string; type: string }[]> {
  const results: { file: string; mtime: number; title: string; type: string }[] = [];
  try {
    const files = await readdir(dir);
    for (const f of files) {
      if (!f.endsWith(".md") || f.startsWith("_")) continue;
      if (!f.startsWith(prefix)) continue;
      const path = join(dir, f);
      const s = await stat(path);
      const content = await readFile(path, "utf-8");
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      let title = f.replace(".md", "").replace(/^[a-z]+-/, "");
      let type = "note";
      if (fmMatch) {
        const fm = fmMatch[1];
        const titleMatch = fm.match(/^title:\s*"?(.+?)"?\s*$/m);
        const typeMatch = fm.match(/^type:\s*(.+?)\s*$/m);
        if (titleMatch) title = titleMatch[1];
        if (typeMatch) type = typeMatch[1];
      }
      results.push({ file: f, mtime: s.mtimeMs, title, type });
    }
  } catch {
    // directory not accessible
  }
  return results;
}

export async function loadNotes(): Promise<Record<string, NoteItem[]>> {
  const result: Record<string, NoteItem[]> = {};
  for (const key of LANE_KEYS) {
    const entries = await scanDir(PATHS.vaultSprint, key);
    const sorted = entries
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 5);
    result[key] = sorted.map((e) => ({
      title: e.title,
      type: e.type,
      updated: Math.floor((Date.now() - e.mtime) / 86400000),
    }));
  }
  return result;
}
