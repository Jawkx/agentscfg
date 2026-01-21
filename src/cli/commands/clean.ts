import path from "node:path";
import { Effect } from "effect";
import { exists, rm } from "../../io/fs";
import { readManaged, type ManagedFile } from "../../core/managed/managed";
import { OwnershipError, WorkspaceMissing } from "../../core/model/errors";

export type CleanResult = {
  removed: string[];
  skipped: string[];
  dryRun: boolean;
};

const normalizeRel = (relPath: string) => relPath.replace(/\\/g, "/");

const expandManagedPaths = (repoRoot: string, managedData: ManagedFile) =>
  Effect.gen(function* (_) {
    const paths: string[] = [];

    for (const entry of managedData.managed) {
      if (entry.endsWith("/**")) {
        // Glob pattern - expand the directory
        const prefix = entry.slice(0, -3);
        const dirPath = path.join(repoRoot, prefix);
        if (yield* _(exists(dirPath))) {
          paths.push(dirPath);
        }
      } else {
        // Exact file path
        const filePath = path.join(repoRoot, entry);
        if (yield* _(exists(filePath))) {
          paths.push(filePath);
        }
      }
    }

    return paths;
  });

export const cleanCommand = (repoRoot: string, dryRun: boolean) =>
  Effect.gen(function* (_) {
    const workspaceRoot = path.join(repoRoot, ".agentscfg");
    if (!(yield* _(exists(workspaceRoot)))) {
      return yield* _(
        Effect.fail(
          new WorkspaceMissing("No .agentscfg workspace found")
        )
      );
    }

    const managedData = yield* _(readManaged(repoRoot));
    if (!managedData) {
      return yield* _(
        Effect.fail(
          new OwnershipError(
            "Managed tracking missing. Run gen with --adopt to establish ownership."
          )
        )
      );
    }

    // Expand managed patterns to actual paths
    const pathsToRemove = yield* _(expandManagedPaths(repoRoot, managedData));

    const removed: string[] = [];
    const skipped: string[] = [];

    for (const targetPath of pathsToRemove) {
      const rel = normalizeRel(path.relative(repoRoot, targetPath));

      if (dryRun) {
        removed.push(rel);
      } else {
        try {
          yield* _(rm(targetPath));
          removed.push(rel);
        } catch {
          skipped.push(rel);
        }
      }
    }

    return {
      removed: removed.sort(),
      skipped: skipped.sort(),
      dryRun
    } satisfies CleanResult;
  });
