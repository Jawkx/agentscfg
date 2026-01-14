import { Effect } from "effect";
import { loadWorkspace, validateWorkspace } from "../../core/model/workspace";
import { planWorkspace } from "../../core/planner/plan";
import { applyPlan } from "../../core/planner/apply";
import type { PlanOptions } from "../../core/model/plan";
import { isDirty, isGitRepo } from "../../io/git";
import { DirtyRepoError } from "../../core/model/errors";

export const syncCommand = (repoRoot: string, options: PlanOptions) =>
  Effect.gen(function* (_) {
    const gitRepo = yield* _(isGitRepo(repoRoot));
    if (gitRepo) {
      const dirty = yield* _(isDirty(repoRoot));
      if (dirty && !options.allowDirty) {
        return yield* _(
          Effect.fail(
            new DirtyRepoError(
              "Refusing to sync: git working tree is dirty. Commit/stash, or pass --allow-dirty."
            )
          )
        );
      }
    }

    const ws = yield* _(loadWorkspace(repoRoot));
    yield* _(validateWorkspace(ws));
    const plan = yield* _(planWorkspace(ws, options));
    yield* _(applyPlan(plan, options));
    return plan;
  });
