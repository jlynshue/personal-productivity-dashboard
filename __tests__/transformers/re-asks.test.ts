import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

import { readFile } from "fs/promises";
import { loadReAsks } from "@/lib/transformers/re-asks";

const mockedReadFile = vi.mocked(readFile);

function makeClustersFile(
  clusters: Array<{
    cluster_id?: string;
    label?: string;
    count?: number;
    recency_weighted_score?: number;
    noise?: boolean;
    is_candidate?: boolean;
    projects?: Array<{ project: string; count: number }>;
  }>
) {
  return JSON.stringify({
    metadata: { total_clusters: clusters.length },
    clusters: clusters.map((c) => ({
      cluster_id: c.cluster_id || "cluster-1",
      label: c.label || "What are my priorities?",
      count: c.count || 5,
      distinct_days: 3,
      projects: c.projects || [{ project: "Claude Code", count: 5 }],
      already_automated: false,
      is_candidate: c.is_candidate ?? false,
      noise: c.noise ?? false,
      recency_weighted_score: c.recency_weighted_score || 10,
    })),
  });
}

describe("re-asks transformer — loadReAsks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters out noise clusters and the 'unmatched' bucket", async () => {
    const data = makeClustersFile([
      { cluster_id: "unmatched", label: "Uncategorized", count: 100, recency_weighted_score: 999 },
      { cluster_id: "real-1", label: "Active projects?", count: 31, noise: false, recency_weighted_score: 50 },
      { cluster_id: "noise-1", label: "Random spam", count: 2, noise: true, recency_weighted_score: 1 },
    ]);
    mockedReadFile.mockResolvedValueOnce(data);

    const result = await loadReAsks();
    // "unmatched" and noise should be filtered out
    expect(result).toHaveLength(1);
    expect(result[0].q).toBe("Active projects?");
  });

  it("sorts by recency_weighted_score descending and limits to 8", async () => {
    const clusters = Array.from({ length: 12 }, (_, i) => ({
      cluster_id: `c-${i}`,
      label: `Cluster ${i}`,
      count: 10 - i,
      recency_weighted_score: (i + 1) * 10,
      noise: false,
    }));
    mockedReadFile.mockResolvedValueOnce(makeClustersFile(clusters));

    const result = await loadReAsks();
    expect(result).toHaveLength(8);
    // Highest score should be first (cluster 11, score 120)
    expect(result[0].q).toBe("Cluster 11");
    expect(result[1].q).toBe("Cluster 10");
  });

  it("maps cluster fields to ReAsk shape correctly", async () => {
    const data = makeClustersFile([
      {
        cluster_id: "priorities",
        label: "What are my active priorities?",
        count: 31,
        recency_weighted_score: 85,
        is_candidate: true,
        projects: [
          { project: "Claude Code", count: 20 },
          { project: "Copilot", count: 11 },
        ],
      },
    ]);
    mockedReadFile.mockResolvedValueOnce(data);

    const result = await loadReAsks();
    expect(result[0]).toEqual({
      id: 1,
      q: "What are my active priorities?",
      count: 31,
      source: "Claude Code", // first project in list
      promoted: true, // is_candidate
    });
  });

  it("returns empty array when file is inaccessible", async () => {
    mockedReadFile.mockRejectedValueOnce(new Error("ENOENT"));

    const result = await loadReAsks();
    expect(result).toEqual([]);
  });

  it("returns empty array when all clusters are noise", async () => {
    const data = makeClustersFile([
      { cluster_id: "n1", noise: true, recency_weighted_score: 50 },
      { cluster_id: "n2", noise: true, recency_weighted_score: 40 },
      { cluster_id: "unmatched", recency_weighted_score: 100 },
    ]);
    mockedReadFile.mockResolvedValueOnce(data);

    const result = await loadReAsks();
    expect(result).toEqual([]);
  });

  it("assigns sequential IDs starting from 1", async () => {
    const clusters = Array.from({ length: 5 }, (_, i) => ({
      cluster_id: `c-${i}`,
      label: `Q${i}`,
      recency_weighted_score: 50 - i * 10,
      noise: false,
    }));
    mockedReadFile.mockResolvedValueOnce(makeClustersFile(clusters));

    const result = await loadReAsks();
    expect(result.map((r) => r.id)).toEqual([1, 2, 3, 4, 5]);
  });
});
