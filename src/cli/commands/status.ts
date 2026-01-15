import path from "node:path";
import { Effect } from "effect";
import { loadWorkspace, validateWorkspace } from "../../core/model/workspace";
import { planWorkspace } from "../../core/planner/plan";
import { exists } from "../../io/fs";
import type { PlanOptions, TargetName } from "../../core/model/plan";
import {
  claudeInstructionPath,
  claudeSkillsRoot
} from "../../adapters/claude";
import {
  opencodeSkillsRoot
} from "../../adapters/opencode";
import {
  codexInstructionPath,
  codexSkillsRoot
} from "../../adapters/codex";

export type FileStatus = "synced" | "outdated" | "missing" | "unmanaged";

export type TargetStatus = {
  name: TargetName;
  enabled: boolean;
  instruction?: { path: string; status: FileStatus };
  skillsRoot: { path: string; status: FileStatus };
};

export type StatusReport = {
  repoRoot: string;
  workspaceValid: boolean;
  targets: TargetStatus[];
  pendingWrites: number;
  pendingCopies: number;
  pendingRemoves: number;
  warnings: string[];
};

const getInstructionPath = (target: TargetName, repoRoot: string) => {
  switch (target) {
    case "claude":
      return claudeInstructionPath(repoRoot);
    case "codex":
      return codexInstructionPath(repoRoot);
    case "opencode":
      return null;
  }
};

const getSkillsRoot = (target: TargetName, repoRoot: string) => {
  switch (target) {
    case "claude":
      return claudeSkillsRoot(repoRoot);
    case "opencode":
      return opencodeSkillsRoot(repoRoot);
    case "codex":
      return codexSkillsRoot(repoRoot);
  }
};

export const statusCommand = (repoRoot: string, options: PlanOptions) =>
  Effect.gen(function* (_) {
    const wsResult = yield* _(Effect.either(loadWorkspace(repoRoot)));

    if (wsResult._tag === "Left") {
      return {
        repoRoot,
        workspaceValid: false,
        targets: [],
        pendingWrites: 0,
        pendingCopies: 0,
        pendingRemoves: 0,
        warnings: ["Workspace not found or invalid"]
      } satisfies StatusReport;
    }

    const ws = wsResult.right;
    const validateResult = yield* _(Effect.either(validateWorkspace(ws)));
    if (validateResult._tag === "Left") {
      return {
        repoRoot,
        workspaceValid: false,
        targets: [],
        pendingWrites: 0,
        pendingCopies: 0,
        pendingRemoves: 0,
        warnings: ["Workspace validation failed"]
      } satisfies StatusReport;
    }

    const plan = yield* _(planWorkspace(ws, options));

    const targetNames: TargetName[] = ["claude", "opencode", "codex"];
    const targets: TargetStatus[] = [];

    // Track which paths have pending writes
    const pendingWritePaths = new Set(
      plan.ops
        .filter((op) => op.type === "WriteFile")
        .map((op) => (op as { path: string }).path)
    );

    const joinRelPath = (root: string, rel: string) =>
      path.join(root, ...rel.split("/"));

    const pendingCopyFilePaths = new Set<string>();
    for (const op of plan.ops) {
      if (op.type !== "CopyDir") continue;
      for (const file of op.files) {
        pendingCopyFilePaths.add(joinRelPath(op.to, file.rel));
      }
    }

    const hasPendingCopyFor = (targetPath: string) =>
      pendingCopyFilePaths.has(targetPath);

    const hasPendingCopyUnder = (targetDir: string) => {
      for (const p of pendingCopyFilePaths) {
        if (p === targetDir || p.startsWith(targetDir + path.sep)) {
          return true;
        }
      }
      return false;
    };

    for (const target of targetNames) {
      const enabled =
        ws.cfg.targets[target as keyof typeof ws.cfg.targets].enabled;

      const instructionPath = getInstructionPath(target, repoRoot);
      const skillsRootPath = getSkillsRoot(target, repoRoot);

      const instructionExists = instructionPath
        ? yield* _(exists(instructionPath))
        : false;
      const skillsRootExists = yield* _(exists(skillsRootPath));

      let instructionStatus: FileStatus | undefined;
      if (instructionPath) {
        if (!enabled) {
          instructionStatus = instructionExists ? "synced" : "missing";
        } else if (!instructionExists) {
          instructionStatus = "missing";
        } else if (
          pendingWritePaths.has(instructionPath) ||
          hasPendingCopyFor(instructionPath)
        ) {
          instructionStatus = "outdated";
        } else {
          instructionStatus = "synced";
        }
      }

      let skillsStatus: FileStatus;
      if (!enabled) {
        skillsStatus = skillsRootExists ? "synced" : "missing";
      } else if (!skillsRootExists && ws.skills.length > 0) {
        skillsStatus = "missing";
      } else if (hasPendingCopyUnder(skillsRootPath)) {
        skillsStatus = "outdated";
      } else {
        skillsStatus = "synced";
      }

      targets.push({
        name: target,
        enabled,
        instruction: instructionPath
          ? {
              path: path.relative(repoRoot, instructionPath),
              status: instructionStatus ?? "missing"
            }
          : undefined,
        skillsRoot: {
          path: path.relative(repoRoot, skillsRootPath),
          status: skillsStatus
        }
      });
    }

    const pendingWrites = plan.ops.filter((op) => op.type === "WriteFile").length;
    const pendingCopies = plan.ops.filter((op) => op.type === "CopyDir").length;
    const pendingRemoves = plan.ops.filter((op) => op.type === "RemovePath").length;

    return {
      repoRoot,
      workspaceValid: true,
      targets,
      pendingWrites,
      pendingCopies,
      pendingRemoves,
      warnings: plan.warnings
    } satisfies StatusReport;
  });
