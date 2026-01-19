import { Effect } from "effect";
import { adapterSpecs } from "./specs";
import { resolveAdapterPathsFromSpec } from "./paths";

export const codexAdapterSpec = adapterSpecs.codex;

export const resolveCodexAdapterPaths = (repoRoot: string) =>
  resolveAdapterPathsFromSpec(repoRoot, codexAdapterSpec);

export const codexInstructionPath = (repoRoot: string) =>
  Effect.runSync(
    resolveCodexAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.instructionPath ?? "")
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
      Effect.map((paths) => paths.mcpConfigPath ?? "")
    )
  );
