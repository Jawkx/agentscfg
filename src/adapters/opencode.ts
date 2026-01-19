import { Effect } from "effect";
import { adapterSpecs } from "./specs";
import { resolveAdapterPathsFromSpec } from "./paths";

export const opencodeAdapterSpec = adapterSpecs.opencode;

export const resolveOpenCodeAdapterPaths = (repoRoot: string) =>
  resolveAdapterPathsFromSpec(repoRoot, opencodeAdapterSpec);

export const opencodeInstructionPath = (repoRoot: string) =>
  Effect.runSync(
    resolveOpenCodeAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.instructionPath ?? "")
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
      Effect.map((paths) => paths.mcpConfigPath ?? "")
    )
  );
