import path from "node:path";
import { Effect } from "effect";
import type { AdapterSpec, AdapterPaths } from "./types";

export const opencodeAdapterSpec = {
  instructionRel: path.join(".opencode", "agent", "default.md"),
  skillsRel: path.join(".opencode", "skill"),
  targetsRel: ".opencode",
  mcpConfigRel: ".mcp.json"
} satisfies AdapterSpec;

export const resolveOpenCodeAdapterPaths = (
  repoRoot: string
): Effect.Effect<AdapterPaths, never, never> =>
  Effect.sync(() => ({
    instructionPath: path.join(repoRoot, opencodeAdapterSpec.instructionRel),
    skillsRoot: path.join(repoRoot, opencodeAdapterSpec.skillsRel),
    targetsRoot: path.join(repoRoot, opencodeAdapterSpec.targetsRel),
    mcpConfigPath: path.join(repoRoot, opencodeAdapterSpec.mcpConfigRel)
  }));

export const opencodeInstructionPath = (repoRoot: string) =>
  Effect.runSync(
    resolveOpenCodeAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.instructionPath)
    )
  );

export const opencodeSkillsRoot = (repoRoot: string) =>
  Effect.runSync(
    resolveOpenCodeAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.skillsRoot)
    )
  );

export const mcpConfigPath = (repoRoot: string) =>
  Effect.runSync(
    resolveOpenCodeAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.mcpConfigPath)
    )
  );
