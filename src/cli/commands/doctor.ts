import path from "node:path";
import { Effect } from "effect";
import { exists } from "../../io/fs";
import { loadWorkspace, validateWorkspace } from "../../core/model/workspace";
import { planWorkspace } from "../../core/planner/plan";
import { readManaged } from "../../core/managed/managed";
import {
  claudeInstructionPath,
  claudeSkillsRoot
} from "../../adapters/claude";
import {
  opencodeInstructionPath,
  opencodeSkillsRoot
} from "../../adapters/opencode";
import {
  codexInstructionPath,
  codexSkillsRoot
} from "../../adapters/codex";
import { mcpConfigPath } from "../../adapters/mcp";

export type OutputStatus = "synced" | "outdated" | "missing";

export type DoctorReport = {
  repoRoot: string;
  workspacePresent: boolean;
  configPresent: boolean;
  basePresent: boolean;
  managedPresent: boolean;
  targets: Record<string, boolean>;
  outputs: Record<string, { exists: boolean; status: OutputStatus }>;
};

export const doctorCommand = (repoRoot: string) =>
  Effect.gen(function* (_) {
    const root = path.join(repoRoot, ".agentscfg");
    const configPath = path.join(root, "agentscfg.jsonc");
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

    // Try to load workspace and generate plan for sync status
    const wsResult = yield* _(Effect.either(loadWorkspace(repoRoot)));
    let pendingWritePaths = new Set<string>();
    let pendingCopyPaths = new Set<string>();

    if (wsResult._tag === "Right") {
      targets = {
        claude: wsResult.right.cfg.targets.claude.enabled,
        opencode: wsResult.right.cfg.targets.opencode.enabled,
        codex: wsResult.right.cfg.targets.codex.enabled
      };

      // Try to generate plan to check sync status
      const validateResult = yield* _(Effect.either(validateWorkspace(wsResult.right)));
      if (validateResult._tag === "Right") {
        const planResult = yield* _(Effect.either(planWorkspace(wsResult.right, {})));
        if (planResult._tag === "Right") {
          pendingWritePaths = new Set(
            planResult.right.ops
              .filter((op) => op.type === "WriteFile")
              .map((op) => (op as { path: string }).path)
          );
          pendingCopyPaths = new Set(
            planResult.right.ops
              .filter((op) => op.type === "CopyDir")
              .map((op) => (op as { to: string }).to)
          );
        }
      }
    }

    const outputPaths = [
      claudeInstructionPath(repoRoot),
      path.join(repoRoot, ".claude"),
      opencodeInstructionPath(repoRoot),
      path.join(repoRoot, ".opencode"),
      codexInstructionPath(repoRoot),
      path.join(repoRoot, ".codex"),
      mcpConfigPath(repoRoot),
      claudeSkillsRoot(repoRoot),
      opencodeSkillsRoot(repoRoot),
      codexSkillsRoot(repoRoot)
    ];

    const outputs: Record<string, { exists: boolean; status: OutputStatus }> = {};

    for (const outputPath of outputPaths) {
      const fileExists = yield* _(exists(outputPath));
      let status: OutputStatus;

      if (!fileExists) {
        status = "missing";
      } else if (
        pendingWritePaths.has(outputPath) ||
        Array.from(pendingCopyPaths).some(
          (p) => p === outputPath || outputPath.startsWith(p + "/") || p.startsWith(outputPath + "/")
        )
      ) {
        status = "outdated";
      } else {
        status = "synced";
      }

      outputs[outputPath] = { exists: fileExists, status };
    }

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
