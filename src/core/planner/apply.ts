import path from "node:path";
import { Effect } from "effect";
import type { Plan, PlanOptions } from "../model/plan";
import { copyFile, mkdirp, rm, writeFileAtomic } from "../../io/fs";
import { IoError } from "../model/errors";

const assertWithinRepoRoot = (repoRoot: string, targetPath: string) =>
  Effect.sync(() => {
    const rootAbs = path.resolve(repoRoot);
    const targetAbs = path.resolve(targetPath);
    const rel = path.relative(rootAbs, targetAbs);

    const within = rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
    if (!within) {
      throw new IoError(
        `Refusing to write/remove outside repo root: ${targetPath}`,
        targetPath
      );
    }
  });

export const applyPlan = (repoRoot: string, plan: Plan, options: PlanOptions) =>
  Effect.gen(function* (_) {
    for (const op of plan.ops) {
      if (op.type === "Mkdirp") {
        yield* _(assertWithinRepoRoot(repoRoot, op.path));
        yield* _(mkdirp(op.path));
      }
    }

    for (const op of plan.ops) {
      if (op.type === "WriteFile") {
        yield* _(assertWithinRepoRoot(repoRoot, op.path));
        yield* _(writeFileAtomic(op.path, op.content));
      }
      if (op.type === "CopyDir") {
        for (const file of op.files) {
          yield* _(assertWithinRepoRoot(repoRoot, file.to));

          if (file.kind === "remove") {
            if (options.remove) {
              yield* _(rm(file.to));
            }
            continue;
          }
          yield* _(copyFile(file.from, file.to, file.mode));
        }
      }
      if (op.type === "RemovePath") {
        yield* _(assertWithinRepoRoot(repoRoot, op.path));
        if (options.remove) {
          yield* _(rm(op.path));
        }
      }
    }
  });
