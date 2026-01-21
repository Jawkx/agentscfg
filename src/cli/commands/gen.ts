import { Effect } from "effect";
import { loadWorkspace, validateWorkspace } from "../../core/model/workspace";
import { planWorkspace } from "../../core/planner/plan";
import { applyPlan } from "../../core/planner/apply";
import type { PlanOptions } from "../../core/model/plan";
import { isDirty, isGitRepo } from "../../io/git";
import { DirtyRepoError, OwnershipError } from "../../core/model/errors";
import { readManaged } from "../../core/managed/managed";

export const genCommand = (repoRoot: string, options: PlanOptions) =>
  Effect.gen(function* (_) {
    const gitRepo = yield* _(isGitRepo(repoRoot));
    if (gitRepo) {
      const dirty = yield* _(isDirty(repoRoot));
      if (dirty && !options.allowDirty) {
        return yield* _(
          Effect.fail(
            new DirtyRepoError(
              "Refusing to run gen: git working tree is dirty. Commit/stash, or pass --allow-dirty."
            )
          )
        );
      }
    }

    const ws = yield* _(loadWorkspace(repoRoot));
    yield* _(validateWorkspace(ws));
    const managedData = yield* _(readManaged(repoRoot));
    if (!managedData && !options.adopt) {
      return yield* _(
        Effect.fail(
          new OwnershipError(
            "Managed tracking missing. Run gen with --adopt to establish ownership."
          )
        )
      );
    }
    const plan = yield* _(planWorkspace(ws, options));
    yield* _(applyPlan(repoRoot, plan, options));
    return plan;
  });
