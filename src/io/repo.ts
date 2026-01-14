import { Effect } from "effect";
import path from "node:path";
import { exists } from "./fs";
import { RepoRootNotFound } from "../core/model/errors";

export const findRepoRoot = (start: string) =>
  Effect.gen(function* (_) {
    let current = path.resolve(start);
    let prev = "";
    while (current !== prev) {
      const gitPath = path.join(current, ".git");
      if (yield* _(exists(gitPath))) {
        return current;
      }
      prev = current;
      current = path.dirname(current);
    }
    return yield* _(Effect.fail(new RepoRootNotFound()));
  });
