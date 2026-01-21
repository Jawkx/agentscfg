import path from "node:path";
import { Effect } from "effect";
import type { AdapterSpec, AdapterPaths, InstructionMode } from "./types";

const toRelParts = (rel: string) =>
  rel.split("/").filter((part) => part.length > 0);

const joinRel = (repoRoot: string, rel: string) =>
  path.join(repoRoot, ...toRelParts(rel));

const normalizeRel = (rel: string) =>
  rel.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/g, "");

const deriveTargetExcludeDirs = <Name extends string>(spec: AdapterSpec<Name>) => {
  const explicit = spec.targets.excludeDirs ?? [];
  const targetsRel = normalizeRel(spec.targets.rel);
  const skillsRel = normalizeRel(spec.skills.rel);
  const derived: string[] = [];

  if (skillsRel && targetsRel && skillsRel !== targetsRel) {
    const prefix = `${targetsRel}/`;
    if (skillsRel.startsWith(prefix)) {
      const rel = skillsRel.slice(prefix.length);
      if (rel) {
        derived.push(rel);
      }
    }
  }

  return Array.from(new Set([...explicit, ...derived]));
};

export const resolveAdapterPathsFromSpec = <Name extends string>(
  repoRoot: string,
  spec: AdapterSpec<Name>
): Effect.Effect<AdapterPaths<Name>, never, never> =>
  Effect.sync(() => {
    const instructionMode: InstructionMode = spec.instruction?.mode ?? "none";
    const targetExcludeDirs = deriveTargetExcludeDirs(spec);
    return {
      name: spec.name,
      instructionPath: spec.instruction
        ? joinRel(repoRoot, spec.instruction.rel)
        : undefined,
      instructionMode,
      instructionTitle: spec.instruction?.title,
      skillsRoot: joinRel(repoRoot, spec.skills.rel),
      targetsRoot: joinRel(repoRoot, spec.targets.rel),
      targetExcludeDirs,
      mcpConfigPath: spec.mcp ? joinRel(repoRoot, spec.mcp.rel) : undefined
    };
  });
