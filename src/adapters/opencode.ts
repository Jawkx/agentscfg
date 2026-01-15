import path from "node:path";

export const opencodeInstructionPath = (repoRoot: string) =>
  path.join(repoRoot, ".opencode", "agent", "default.md");

export const opencodeSkillsRoot = (repoRoot: string) =>
  path.join(repoRoot, ".opencode", "skill");

export const opencodeClaudeCompatSkillsRoot = (repoRoot: string) =>
  path.join(repoRoot, ".claude", "skills");

export const mcpConfigPath = (repoRoot: string) =>
  path.join(repoRoot, ".mcp.json");
