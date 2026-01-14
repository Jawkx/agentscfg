import path from "node:path";
import { Effect } from "effect";
import { exists } from "../../io/fs";
import { loadWorkspace } from "../../core/model/workspace";
import { readManaged } from "../../core/managed/managed";
import {
  claudeInstructionPath,
  claudeSkillsRoot,
  claudeSettingsPath
} from "../../adapters/claude";
import {
  opencodeInstructionPath,
  opencodeSkillsRoot,
  opencodeSettingsPath
} from "../../adapters/opencode";
import {
  codexInstructionPath,
  codexSkillsRoot,
  codexConfigPath
} from "../../adapters/codex";
import { mcpConfigPath } from "../../adapters/mcp";

export type DoctorReport = {
  repoRoot: string;
  workspacePresent: boolean;
  configPresent: boolean;
  basePresent: boolean;
  managedPresent: boolean;
  targets: Record<string, boolean>;
  outputs: Record<string, boolean>;
};

export const doctorCommand = (repoRoot: string) =>
  Effect.gen(function* (_) {
    const root = path.join(repoRoot, ".agentcfg");
    const configPath = path.join(root, "agentcfg.jsonc");
    const basePath = path.join(root, "instructions", "BASE.md");

    const workspacePresent = yield* _(exists(root));
    const configPresent = yield* _(exists(configPath));
    const basePresent = yield* _(exists(basePath));
    const managedPresent = (yield* _(readManaged(repoRoot))) !== null;

    let targets: Record<string, boolean> = {
      claude: false,
      opencode: false,
      codex: false
    };
    const wsResult = yield* _(Effect.either(loadWorkspace(repoRoot)));
    if (wsResult._tag === "Right") {
      targets = {
        claude: wsResult.right.cfg.targets.claude.enabled,
        opencode: wsResult.right.cfg.targets.opencode.enabled,
        codex: wsResult.right.cfg.targets.codex.enabled
      };
    }

    const outputs: Record<string, boolean> = {
      [claudeInstructionPath(repoRoot)]: yield* _(exists(
        claudeInstructionPath(repoRoot)
      )),
      [path.join(repoRoot, ".claude")]: yield* _(exists(
        path.join(repoRoot, ".claude")
      )),
      [opencodeInstructionPath(repoRoot)]: yield* _(exists(
        opencodeInstructionPath(repoRoot)
      )),
      [path.join(repoRoot, ".opencode")]: yield* _(exists(
        path.join(repoRoot, ".opencode")
      )),
      [opencodeSettingsPath(repoRoot)]: yield* _(exists(
        opencodeSettingsPath(repoRoot)
      )),
      [codexInstructionPath(repoRoot)]: yield* _(exists(
        codexInstructionPath(repoRoot)
      )),
      [path.join(repoRoot, ".codex")]: yield* _(exists(
        path.join(repoRoot, ".codex")
      )),
      [codexConfigPath(repoRoot)]: yield* _(exists(codexConfigPath(repoRoot))),
      [mcpConfigPath(repoRoot)]: yield* _(exists(mcpConfigPath(repoRoot))),
      [claudeSkillsRoot(repoRoot)]: yield* _(exists(claudeSkillsRoot(repoRoot))),
      [claudeSettingsPath(repoRoot)]: yield* _(exists(
        claudeSettingsPath(repoRoot)
      )),
      [opencodeSkillsRoot(repoRoot)]: yield* _(exists(
        opencodeSkillsRoot(repoRoot)
      )),
      [codexSkillsRoot(repoRoot)]: yield* _(exists(codexSkillsRoot(repoRoot)))
    };

    return {
      repoRoot,
      workspacePresent,
      configPresent,
      basePresent,
      managedPresent,
      targets,
      outputs
    } satisfies DoctorReport;
  });
