import { Effect } from "effect";
import { loadWorkspace, validateWorkspace } from "../../core/model/workspace";

export const validateCommand = (repoRoot: string) =>
  Effect.gen(function* (_) {
    const ws = yield* _(loadWorkspace(repoRoot));
    yield* _(validateWorkspace(ws));
    return true;
  });
