import { Effect } from "effect";
import { loadWorkspace, validateWorkspace } from "../../core/model/workspace";
import { planWorkspace } from "../../core/planner/plan";
import { renderDiff } from "../../core/planner/diff";
import { PlanOptions } from "../../core/model/plan";

export const diffCommand = (repoRoot: string, options: PlanOptions) =>
  Effect.gen(function* (_) {
    const ws = yield* _(loadWorkspace(repoRoot));
    yield* _(validateWorkspace(ws));
    const plan = yield* _(planWorkspace(ws, options));
    const diff = yield* _(renderDiff(repoRoot, plan));
    return { plan, diff };
  });
