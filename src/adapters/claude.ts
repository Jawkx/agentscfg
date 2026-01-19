import { Effect } from "effect";
import { adapterSpecs } from "./specs";
import { resolveAdapterPathsFromSpec } from "./paths";

export const claudeAdapterSpec = adapterSpecs.claude;

export const resolveClaudeAdapterPaths = (repoRoot: string) =>
  resolveAdapterPathsFromSpec(repoRoot, claudeAdapterSpec);

export const claudeInstructionPath = (repoRoot: string) =>
  Effect.runSync(
    resolveClaudeAdapterPaths(repoRoot).pipe(
      Effect.map((paths) => paths.instructionPath ?? "")
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
      Effect.map((paths) => paths.mcpConfigPath ?? "")
    )
  );
