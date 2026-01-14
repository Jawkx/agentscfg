import { Effect } from "effect";
import { findRepoRoot } from "../io/repo";
import { initCommand } from "./commands/init";
import { validateCommand } from "./commands/validate";
import { planCommand } from "./commands/plan";
import { diffCommand } from "./commands/diff";
import { syncCommand } from "./commands/sync";
import { doctorCommand } from "./commands/doctor";
import { renderPlanSummary, renderWarnings, renderDoctorReport } from "./render";
import type { PlanOptions, TargetName } from "../core/model/plan";
import { error, info } from "../io/console";

const parseArgs = (argv: string[]) => {
  const args = [...argv];
  const command = args.shift() ?? "help";
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  while (args.length > 0) {
    const current = args.shift()!;
    if (current.startsWith("--")) {
      const [flag, value] = current.split("=");
      if (!flag) {
        continue;
      }
      if (value !== undefined) {
        flags[flag] = value;
      } else if (args[0] && !args[0].startsWith("--")) {
        if (flag === "--to") {
          flags[flag] = args.shift()!;
        } else {
          flags[flag] = true;
        }
      } else {
        flags[flag] = true;
      }
    } else {
      positionals.push(current);
    }
  }

  return { command, flags, positionals };
};

const parseTargets = (value?: string): Set<TargetName> | undefined => {
  if (!value) return undefined;
  const set = new Set<TargetName>();
  const parts = value.split(",").map((p) => p.trim());
  for (const part of parts) {
    if (part === "claude" || part === "opencode" || part === "codex") {
      set.add(part);
    }
  }
  return set.size > 0 ? set : undefined;
};

const buildOptions = (flags: Record<string, string | boolean>): PlanOptions => ({
  targets: parseTargets(
    typeof flags["--to"] === "string" ? (flags["--to"] as string) : undefined
  ),
  remove: Boolean(flags["--remove"]),
  adopt: Boolean(flags["--adopt"]),
  force: Boolean(flags["--force"]),
  allowDirty: Boolean(flags["--allow-dirty"])
});

const run = async () => {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  let repoRoot: string;

  try {
    repoRoot = await findRepoRoot(cwd).pipe(Effect.runPromise);
  } catch (err) {
    if (command === "init") {
      repoRoot = cwd;
    } else {
      throw err;
    }
  }

  switch (command) {
    case "init": {
      const force = Boolean(flags["--force"]);
      const root = await initCommand(repoRoot, force).pipe(Effect.runPromise);
      info(`Initialized ${root}`);
      return;
    }
    case "validate": {
      await validateCommand(repoRoot).pipe(Effect.runPromise);
      info("Validation ok");
      return;
    }
    case "plan": {
      const plan = await planCommand(repoRoot, buildOptions(flags)).pipe(
        Effect.runPromise
      );
      if (flags["--json"]) {
        console.log(JSON.stringify(plan, null, 2));
        return;
      }
      info(renderPlanSummary(plan));
      const warnings = renderWarnings(plan.warnings);
      if (warnings) info(warnings);
      return;
    }
    case "diff": {
      const { plan, diff } = await diffCommand(repoRoot, buildOptions(flags)).pipe(
        Effect.runPromise
      );
      info(renderPlanSummary(plan));
      const warnings = renderWarnings(plan.warnings);
      if (warnings) info(warnings);
      console.log(diff || "(no changes)");
      return;
    }
    case "sync": {
      const plan = await syncCommand(repoRoot, buildOptions(flags)).pipe(
        Effect.runPromise
      );
      info(renderPlanSummary(plan));
      const warnings = renderWarnings(plan.warnings);
      if (warnings) info(warnings);
      info("Sync complete");
      return;
    }
    case "doctor": {
      const report = await doctorCommand(repoRoot).pipe(Effect.runPromise);
      info(renderDoctorReport(report));
      return;
    }
    default: {
      info(
        [
          "agentcfg <command>",
          "",
          "Commands:",
          "  init [--force]",
          "  validate",
          "  plan [--to claude,opencode,codex] [--json]",
          "  diff [--to ...]",
          "  sync [--to ...] [--remove] [--adopt] [--force] [--allow-dirty]",
          "  doctor"
        ].join("\n")
      );
    }
  }
};

run().catch((err) => {
  error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
