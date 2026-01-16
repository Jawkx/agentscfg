import path from "node:path";
import { Effect } from "effect";
import type { AdapterSpec, AdapterPaths } from "./types";

const mcpConfigRel = ".mcp.json";

export const claudeAdapterSpec = {
  instructionRel: "CLAUDE.md",
  skillsRel: path.join(".claude", "skills"),
  targetsRel: ".claude",
  mcpConfigRel
} satisfies AdapterSpec;

export const resolveClaudeAdapterPaths = (repoRoot: string) =>
  Effect.sync(() =>
    ({
      instructionPath: path.join(repoRoot, claudeAdapterSpec.instructionRel),
      skillsRoot: path.join(repoRoot, claudeAdapterSpec.skillsRel),
      extraSkillsRoots: [],
      targetsRoot: path.join(repoRoot, claudeAdapterSpec.targetsRel),
      mcpConfigPath: path.join(repoRoot, claudeAdapterSpec.mcpConfigRel)
    } satisfies AdapterPaths)
  );

export const claudeInstructionPath = (repoRoot: string) =>
  Effect.runSync(
    resolveClaudeAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.instructionPath)
    )
  );

export const claudeSkillsRoot = (repoRoot: string) =>
  Effect.runSync(
    resolveClaudeAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.skillsRoot)
    )
  );

export const mcpConfigPath = (repoRoot: string) =>
  Effect.runSync(
    resolveClaudeAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.mcpConfigPath)
    )
  );
