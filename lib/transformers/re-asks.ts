import { readFile } from "fs/promises";
import { PATHS } from "@/lib/config";
import type { ReAsk } from "@/lib/data";

interface Cluster {
  cluster_id: string;
  label: string;
  count: number;
  distinct_days: number;
  projects: { project: string; count: number }[];
  already_automated: boolean;
  is_candidate: boolean;
  noise: boolean;
  recency_weighted_score: number;
}

interface ClustersFile {
  metadata: { total_clusters: number };
  clusters: Cluster[];
}

export async function loadReAsks(): Promise<ReAsk[]> {
  try {
    const raw = await readFile(PATHS.requestClusters, "utf-8");
    const file: ClustersFile = JSON.parse(raw);

    return file.clusters
      .filter((c) => c.cluster_id !== "unmatched" && !c.noise)
      .sort((a, b) => b.recency_weighted_score - a.recency_weighted_score)
      .slice(0, 8)
      .map((c, i) => ({
        id: i + 1,
        q: c.label,
        count: c.count,
        source: c.projects[0]?.project || "unknown",
        promoted: c.is_candidate,
      }));
  } catch {
    return [];
  }
}
