import path from "node:path";
import { Effect } from "effect";
import type { AdapterSpec, AdapterPaths, InstructionMode } from "./types";

const toRelParts = (rel: string) =>
  rel.split("/").filter((part) => part.length > 0);

const joinRel = (repoRoot: string, rel: string) =>
  path.join(repoRoot, ...toRelParts(rel));

export const resolveAdapterPathsFromSpec = (
  repoRoot: string,
  spec: AdapterSpec
): Effect.Effect<AdapterPaths, never, never> =>
  Effect.sync(() => {
    const instructionMode: InstructionMode = spec.instruction?.mode ?? "none";
    return {
      name: spec.name,
      instructionPath: spec.instruction
        ? joinRel(repoRoot, spec.instruction.rel)
        : undefined,
      instructionMode,
      instructionTitle: spec.instruction?.title,
      skillsRoot: joinRel(repoRoot, spec.skills.rel),
      targetsRoot: joinRel(repoRoot, spec.targets.rel),
      targetExcludeDirs: spec.targets.excludeDirs ?? [],
      mcpConfigPath: spec.mcp ? joinRel(repoRoot, spec.mcp.rel) : undefined
    };
  });
