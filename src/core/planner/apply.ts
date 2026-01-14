import { Effect } from "effect";
import { Plan, PlanOptions } from "../model/plan";
import { copyFile, mkdirp, rm, writeFileAtomic } from "../../io/fs";

export const applyPlan = (plan: Plan, options: PlanOptions) =>
  Effect.gen(function* (_) {
    for (const op of plan.ops) {
      if (op.type === "Mkdirp") {
        yield* _(mkdirp(op.path));
      }
    }

    for (const op of plan.ops) {
      if (op.type === "WriteFile") {
        yield* _(writeFileAtomic(op.path, op.content));
      }
      if (op.type === "CopyDir") {
        for (const file of op.files) {
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
        if (options.remove) {
          yield* _(rm(op.path));
        }
      }
    }
  });
