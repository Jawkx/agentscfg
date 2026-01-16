import path from "node:path";
import { Effect } from "effect";

export type AdapterName = "claude" | "opencode" | "codex";

export type AdapterSpec = {
  instructionRel: string;
  skillsRel: string;
  extraSkillsRel?: readonly string[];
  targetsRel: string;
  mcpConfigRel: string;
};

export type AdapterPaths = {
  instructionPath: string;
  skillsRoot: string;
  extraSkillsRoots: readonly string[];
  targetsRoot: string;
  mcpConfigPath: string;
};

export type AllAdapterPaths = Record<AdapterName, AdapterPaths>;

const mcpConfigRel = ".mcp.json";

const adapterSpecs: Record<AdapterName, AdapterSpec> = {
  claude: {
    instructionRel: "CLAUDE.md",
    skillsRel: path.join(".claude", "skills"),
    targetsRel: ".claude",
    mcpConfigRel
  },
  opencode: {
    instructionRel: path.join(".opencode", "agent", "default.md"),
    skillsRel: path.join(".opencode", "skill"),
    extraSkillsRel: [path.join(".claude", "skills")],
    targetsRel: ".opencode",
    mcpConfigRel
  },
  codex: {
    instructionRel: "AGENTS.md",
    skillsRel: path.join(".codex", "skills"),
    targetsRel: ".codex",
    mcpConfigRel
  }
};

export const resolveAdapterPaths = (repoRoot: string, name: AdapterName) =>
  Effect.sync(() => {
    const spec = adapterSpecs[name];

    return {
      instructionPath: path.join(repoRoot, spec.instructionRel),
      skillsRoot: path.join(repoRoot, spec.skillsRel),
      extraSkillsRoots: (spec.extraSkillsRel ?? []).map((rel) =>
        path.join(repoRoot, rel)
      ),
      targetsRoot: path.join(repoRoot, spec.targetsRel),
      mcpConfigPath: path.join(repoRoot, spec.mcpConfigRel)
    } satisfies AdapterPaths;
  });

export const resolveAllAdapterPaths = (repoRoot: string) => {
  const effects = {
    claude: resolveAdapterPaths(repoRoot, "claude"),
    opencode: resolveAdapterPaths(repoRoot, "opencode"),
    codex: resolveAdapterPaths(repoRoot, "codex")
  } satisfies Record<AdapterName, Effect.Effect<AdapterPaths, never, never>>;

  return Effect.all(effects) as Effect.Effect<AllAdapterPaths, never, never>;
};
