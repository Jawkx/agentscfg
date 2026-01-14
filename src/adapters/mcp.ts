import path from "node:path";

export const mcpConfigPath = (repoRoot: string) =>
  path.join(repoRoot, ".mcp.json");
