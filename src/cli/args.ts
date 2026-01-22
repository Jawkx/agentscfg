import type { PlanOptions, TargetName } from "../core/model/plan";
import { InvalidConfig } from "../core/model/errors";

export type ParsedArgs = {
  command: string;
  flags: Record<string, string | boolean>;
  positionals: string[];
};

const FLAGS_WITH_VALUES = new Set(["--to", "--from"]);

export const parseArgs = (argv: string[]): ParsedArgs => {
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
        if (FLAGS_WITH_VALUES.has(flag)) {
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

export const parseTargets = (value?: string) => {
  if (!value) return { targets: undefined, invalid: [] as string[] };
  const set = new Set<TargetName>();
  const invalid: string[] = [];
  const parts = value.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
  for (const part of parts) {
    if (part === "claude" || part === "opencode" || part === "codex") {
      set.add(part);
    } else {
      invalid.push(part);
    }
  }
  return { targets: set.size > 0 ? set : undefined, invalid };
};

export const buildOptions = (flags: Record<string, string | boolean>): PlanOptions => {
  const rawTargets =
    typeof flags["--to"] === "string" ? (flags["--to"] as string) : undefined;
  const parsed = parseTargets(rawTargets);

  if (rawTargets !== undefined) {
    if (parsed.invalid.length > 0) {
      throw new InvalidConfig(
        `Invalid --to target(s): ${parsed.invalid.join(", ")}`
      );
    }
    if (!parsed.targets) {
      throw new InvalidConfig("Missing valid targets for --to");
    }
  }

  return {
    targets: parsed.targets,
    remove: Boolean(flags["--remove"]),
    adopt: Boolean(flags["--adopt"]),
    force: Boolean(flags["--force"]),
    allowDirty: Boolean(flags["--allow-dirty"]),
    dryRun: Boolean(flags["--dry-run"])
  };
};
