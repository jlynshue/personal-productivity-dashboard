import { join } from "path";

const CODE_PROJECTS = process.env.CODE_PROJECTS_ROOT || "/Users/user/code-projects";

export const PATHS = {
  unifiedTasks: join(CODE_PROJECTS, "outputs/unified_tasks.json"),
  vaultSprint: join(
    CODE_PROJECTS,
    "tools/obsidian-vaults-v2/01.00-Maps-of-Content/Agile-Sprint"
  ),
  vaultProjects: join(CODE_PROJECTS, "tools/obsidian-vaults-v2/10.00-Projects"),
  vaultAreas: join(CODE_PROJECTS, "tools/obsidian-vaults-v2/20.00-Areas"),
  dashLive: join(CODE_PROJECTS, "outputs/dashboard-live"),
  requestClusters: join(
    CODE_PROJECTS,
    "outputs/request-mining/request_clusters.json"
  ),
};

export function isLocal(): boolean {
  return (
    process.env.NODE_ENV === "development" || process.env.DASH_LOCAL === "1"
  );
}
