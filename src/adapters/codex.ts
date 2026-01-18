import path from "node:path";
import { Effect } from "effect";
import type { AdapterSpec, AdapterPaths } from "./types";

export const codexAdapterSpec = {
  instructionRel: "AGENTS.md",
  skillsRel: path.join(".codex", "skills"),
  targetsRel: ".codex",
  mcpConfigRel: ".mcp.json"
} satisfies AdapterSpec;

export const resolveCodexAdapterPaths = (
  repoRoot: string
): Effect.Effect<AdapterPaths, never, never> =>
  Effect.sync(() => ({
    instructionPath: path.join(repoRoot, codexAdapterSpec.instructionRel),
    skillsRoot: path.join(repoRoot, codexAdapterSpec.skillsRel),
    extraSkillsRoots: [],
    targetsRoot: path.join(repoRoot, codexAdapterSpec.targetsRel),
    mcpConfigPath: path.join(repoRoot, codexAdapterSpec.mcpConfigRel)
  }));

export const codexInstructionPath = (repoRoot: string) =>
  Effect.runSync(
    resolveCodexAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.instructionPath)
    )
  );

export const codexSkillsRoot = (repoRoot: string) =>
  Effect.runSync(
    resolveCodexAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.skillsRoot)
    )
  );

export const mcpConfigPath = (repoRoot: string) =>
  Effect.runSync(
    resolveCodexAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.mcpConfigPath)
    )
  );
