import { Effect } from "effect";
import { resolveAdapterPaths } from "./index";

export const codexInstructionPath = (repoRoot: string) =>
  Effect.runSync(
    resolveAdapterPaths(repoRoot, "codex").pipe(
      Effect.map((paths) => paths.instructionPath)
    )
  );

export const codexSkillsRoot = (repoRoot: string) =>
  Effect.runSync(
    resolveAdapterPaths(repoRoot, "codex").pipe(
      Effect.map((paths) => paths.skillsRoot)
    )
  );

export const mcpConfigPath = (repoRoot: string) =>
  Effect.runSync(
    resolveAdapterPaths(repoRoot, "codex").pipe(
      Effect.map((paths) => paths.mcpConfigPath)
    )
  );
