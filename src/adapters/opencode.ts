import { Effect } from "effect";
import { resolveAdapterPaths } from "./index";

export const opencodeInstructionPath = (repoRoot: string) =>
  Effect.runSync(
    resolveAdapterPaths(repoRoot, "opencode").pipe(
      Effect.map((paths) => paths.instructionPath)
    )
  );

export const opencodeSkillsRoot = (repoRoot: string) =>
  Effect.runSync(
    resolveAdapterPaths(repoRoot, "opencode").pipe(
      Effect.map((paths) => paths.skillsRoot)
    )
  );

export const opencodeClaudeCompatSkillsRoot = (repoRoot: string) =>
  Effect.runSync(
    resolveAdapterPaths(repoRoot, "opencode").pipe(
      Effect.map((paths) => paths.extraSkillsRoots[0] ?? "")
    )
  );

export const mcpConfigPath = (repoRoot: string) =>
  Effect.runSync(
    resolveAdapterPaths(repoRoot, "opencode").pipe(
      Effect.map((paths) => paths.mcpConfigPath)
    )
  );
