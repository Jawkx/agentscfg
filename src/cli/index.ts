import { Effect } from "effect";
import { findRepoRoot } from "../io/repo";
import { initCommand } from "./commands/init";
import { validateCommand } from "./commands/validate";
import { planCommand } from "./commands/plan";
import { diffCommand } from "./commands/diff";
import { syncCommand } from "./commands/sync";
import { doctorCommand } from "./commands/doctor";
import { statusCommand } from "./commands/status";
import { cleanCommand } from "./commands/clean";
import {
  renderPlanSummary,
  renderWarnings,
  renderDoctorReport,
  renderStatusReport,
  renderCleanResult,
  renderSyncSummary
} from "./render";
import { parseArgs, buildOptions } from "./args";
import { getHelp } from "./help";
import { error, info } from "../io/console";
import {
  InvalidConfig,
  InvalidSkill,
  WorkspaceMissing,
  OwnershipError,
  DirtyRepoError,
  RepoRootNotFound
} from "../core/model/errors";

const formatError = (err: unknown): string => {
  if (err instanceof InvalidConfig) {
    let msg = `Configuration error: ${err.message}`;
    if (err.details) {
      msg += `\n  Details: ${err.details}`;
    }
    msg += `\n  Hint: Check your .agentscfg/agentscfg.jsonc file`;
    return msg;
  }

  if (err instanceof InvalidSkill) {
    return `Skill error: ${err.message}\n  Hint: Each skill directory needs a SKILL.md file`;
  }

  if (err instanceof WorkspaceMissing) {
    return `Workspace not found: ${err.message}\n  Hint: Run 'agentscfg init' to create a workspace`;
  }

  if (err instanceof OwnershipError) {
    return `Ownership conflict: ${err.message}\n  Hint: Use --adopt to take ownership or --force to overwrite`;
  }

  if (err instanceof DirtyRepoError) {
    return `Git safety check failed: ${err.message}\n  Hint: Commit your changes first, or use --allow-dirty to override`;
  }

  if (err instanceof RepoRootNotFound) {
    return `Not in a git repository: ${err.message}\n  Hint: Run this command from within a git repository`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return String(err);
};

const run = async () => {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  let repoRoot: string;

  // Show help for --help flag on any command
  if (flags["--help"]) {
    info(getHelp(command));
    return;
  }

  try {
    repoRoot = await findRepoRoot(cwd).pipe(Effect.runPromise);
  } catch (err) {
    if (command === "init") {
      repoRoot = cwd;
    } else if (command === "help" || !command) {
      info(getHelp());
      return;
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
      info(renderSyncSummary(plan));
      const warnings = renderWarnings(plan.warnings);
      if (warnings) info(warnings);
      return;
    }
    case "status": {
      const report = await statusCommand(repoRoot, buildOptions(flags)).pipe(
        Effect.runPromise
      );
      info(renderStatusReport(report));
      return;
    }
    case "clean": {
      const dryRun = Boolean(flags["--dry-run"]);
      const result = await cleanCommand(repoRoot, dryRun).pipe(
        Effect.runPromise
      );
      info(renderCleanResult(result));
      return;
    }
    case "doctor": {
      const report = await doctorCommand(repoRoot).pipe(Effect.runPromise);
      info(renderDoctorReport(report));
      return;
    }
    case "help":
    default: {
      info(getHelp(flags["--help"] ? undefined : undefined));
    }
  }
};

run().catch((err) => {
  error(formatError(err));
  process.exitCode = 1;
});
