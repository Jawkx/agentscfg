import { Effect, Schema } from "effect";
import { parse as parseJsonc } from "jsonc-parser";
import path from "node:path";
import { readFileString, exists, readdir } from "../../io/fs";
import { InvalidConfig, InvalidSkill, WorkspaceMissing } from "./errors";
import { AgentCfgSchema, withDefaults, type ResolvedAgentCfg } from "./config";
import { isExcludedPath } from "../planner/skills";

export type InstructionSources = {
  basePath: string;
  projectPath?: string;
  base: string;
  project?: string;
};

export type SkillSource = {
  name: string;
  dir: string;
};

export type Workspace = {
  repoRoot: string;
  root: string;
  configPath: string;
  cfg: ResolvedAgentCfg;
  instructions: InstructionSources;
  skills: SkillSource[];
  targets: {
    claudeSettings?: { path: string; content: string };
    opencodeSettings?: { path: string; content: string };
    codexConfig?: { path: string; content: string };
  };
  mcp?: { path: string; content: string };
};

const parseConfig = (raw: string, pathLabel: string) =>
  Effect.try({
    try: () => {
      const errors: import("jsonc-parser").ParseError[] = [];
      const data = parseJsonc(raw, errors, { allowTrailingComma: true });
      if (errors.length > 0) {
        const msg = errors
          .map((e) => `offset ${e.offset}: ${e.error}`)
          .join(", ");
        throw new InvalidConfig(`Invalid JSONC in ${pathLabel}`, msg);
      }
      return data as unknown;
    },
    catch: (err) =>
      err instanceof InvalidConfig
        ? err
        : new InvalidConfig(`Invalid JSONC in ${pathLabel}`, String(err))
  });

export const loadWorkspace = (repoRoot: string) => {
  const root = path.join(repoRoot, ".agentscfg");
  const configPath = path.join(root, "agentscfg.jsonc");
  const basePath = path.join(root, "instructions", "BASE.md");
  const projectPath = path.join(root, "instructions", "PROJECT.md");
  const skillsRoot = path.join(root, "skills");
  const targetsRoot = path.join(root, "targets");
  const mcpRoot = path.join(root, "mcp");
  const claudeSettingsPath = path.join(targetsRoot, "claude.settings.json");
  const opencodeSettingsPath = path.join(targetsRoot, "opencode.json");
  const codexConfigPath = path.join(targetsRoot, "codex.config.toml");
  const mcpPath = path.join(mcpRoot, "mcp.json");

  return Effect.gen(function* (_) {
    const rootExists = yield* _(exists(root));
    if (!rootExists) {
      return yield* _(Effect.fail(new WorkspaceMissing()));
    }

    const configExists = yield* _(exists(configPath));
    if (!configExists) {
      return yield* _(Effect.fail(new InvalidConfig("Missing agentscfg.jsonc")));
    }

    const rawConfig = yield* _(readFileString(configPath));
    const parsed = yield* _(parseConfig(rawConfig, configPath));
    const decoded = yield* _(
      Schema.decodeUnknown(AgentCfgSchema)(parsed).pipe(
        Effect.mapError((err) => new InvalidConfig("Invalid agentscfg.jsonc", String(err)))
      )
    );

    const cfg = withDefaults(decoded);

    const baseExists = yield* _(exists(basePath));
    if (!baseExists) {
      return yield* _(Effect.fail(new InvalidConfig("Missing BASE.md")));
    }

    const base = yield* _(readFileString(basePath));
    const projectExists = yield* _(exists(projectPath));
    const project = projectExists ? yield* _(readFileString(projectPath)) : undefined;

    const skills: SkillSource[] = [];
    const skillsExists = yield* _(exists(skillsRoot));
    if (skillsExists) {
      const entries = yield* _(readdir(skillsRoot));
      const dirs = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));
      for (const dir of dirs) {
        if (isExcludedPath(dir)) {
          continue;
        }
        skills.push({ name: dir, dir: path.join(skillsRoot, dir) });
      }
    }

    const targets = {
      claudeSettings: undefined as Workspace["targets"]["claudeSettings"],
      opencodeSettings: undefined as Workspace["targets"]["opencodeSettings"],
      codexConfig: undefined as Workspace["targets"]["codexConfig"]
    };

    if (yield* _(exists(claudeSettingsPath))) {
      targets.claudeSettings = {
        path: claudeSettingsPath,
        content: yield* _(readFileString(claudeSettingsPath))
      };
    }
    if (yield* _(exists(opencodeSettingsPath))) {
      targets.opencodeSettings = {
        path: opencodeSettingsPath,
        content: yield* _(readFileString(opencodeSettingsPath))
      };
    }
    if (yield* _(exists(codexConfigPath))) {
      targets.codexConfig = {
        path: codexConfigPath,
        content: yield* _(readFileString(codexConfigPath))
      };
    }

    let mcp: Workspace["mcp"] = undefined;
    if (yield* _(exists(mcpPath))) {
      mcp = {
        path: mcpPath,
        content: yield* _(readFileString(mcpPath))
      };
    }

    return {
      repoRoot,
      root,
      configPath,
      cfg,
      instructions: {
        basePath,
        projectPath: projectExists ? projectPath : undefined,
        base,
        project
      },
      skills,
      targets,
      mcp
    } satisfies Workspace;
  });
};

export const validateWorkspace = (ws: Workspace) =>
  Effect.gen(function* (_) {
    const baseOk = yield* _(exists(ws.instructions.basePath));
    if (!baseOk) {
      return yield* _(Effect.fail(new InvalidConfig("Missing BASE.md")));
    }

    for (const skill of ws.skills) {
      const skillFile = path.join(skill.dir, "SKILL.md");
      const skillExists = yield* _(exists(skillFile));
      if (!skillExists) {
        return yield* _(
          Effect.fail(
            new InvalidSkill(`Missing SKILL.md for skill ${skill.name}`)
          )
        );
      }
    }

    return true;
  });
