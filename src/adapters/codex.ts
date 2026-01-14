import path from "node:path";

export const codexInstructionPath = (repoRoot: string) =>
  path.join(repoRoot, "AGENTS.md");

export const codexSkillsRoot = (repoRoot: string) =>
  path.join(repoRoot, ".codex", "skills");
