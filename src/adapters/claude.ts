import { Effect } from "effect";
import { resolveAdapterPaths } from "./index";

export const claudeInstructionPath = (repoRoot: string) =>
  Effect.runSync(
    resolveAdapterPaths(repoRoot, "claude").pipe(
      Effect.map((paths) => paths.instructionPath)
    )
  );

export const claudeSkillsRoot = (repoRoot: string) =>
  Effect.runSync(
    resolveAdapterPaths(repoRoot, "claude").pipe(
      Effect.map((paths) => paths.skillsRoot)
    )
  );

export const mcpConfigPath = (repoRoot: string) =>
  Effect.runSync(
    resolveAdapterPaths(repoRoot, "claude").pipe(
      Effect.map((paths) => paths.mcpConfigPath)
    )
  );
