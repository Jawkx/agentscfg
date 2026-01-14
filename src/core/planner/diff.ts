import path from "node:path";
import { Effect } from "effect";
import { createTwoFilesPatch } from "diff";
import { Plan } from "../model/plan";
import { readFileString, exists } from "../../io/fs";

const renderCopyFiles = (from: string, to: string, files: { kind: string; rel: string }[]) => {
  const lines = [`Copy ${from} -> ${to}`];
  for (const file of files) {
    const prefix = file.kind === "add" ? "+" : file.kind === "remove" ? "-" : "~";
    lines.push(`  ${prefix} ${file.rel}`);
  }
  return lines.join("\n");
};

export const renderDiff = (repoRoot: string, plan: Plan) =>
  Effect.gen(function* (_) {
    const outputs: string[] = [];

    for (const op of plan.ops) {
      if (op.type === "WriteFile") {
        const existsNow = yield* _(exists(op.path));
        const before = existsNow ? yield* _(readFileString(op.path)) : "";
        const relPath = path.relative(repoRoot, op.path).replace(/\\/g, "/");
        const patch = createTwoFilesPatch(
          relPath,
          relPath,
          before,
          op.content,
          "",
          "",
          { context: 3 }
        );
        outputs.push(patch.trimEnd());
      }
      if (op.type === "CopyDir") {
        outputs.push(renderCopyFiles(op.from, op.to, op.files));
      }
    }

    return outputs.join("\n\n");
  });
