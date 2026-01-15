import path from "node:path";

export const claudeInstructionPath = (repoRoot: string) =>
  path.join(repoRoot, "CLAUDE.md");

export const claudeSkillsRoot = (repoRoot: string) =>
  path.join(repoRoot, ".claude", "skills");

export const mcpConfigPath = (repoRoot: string) =>
  path.join(repoRoot, ".mcp.json");
