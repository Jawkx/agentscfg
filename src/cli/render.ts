import path from "node:path";
import type { Plan } from "../core/model/plan";
import type { DoctorReport } from "./commands/doctor";
import type { StatusReport, FileStatus } from "./commands/status";
import type { CleanResult } from "./commands/clean";
import type { ImportResult } from "./commands/import";
import { green, yellow, red, cyan, dim, bold } from "../io/console";

export const renderPlanSummary = (plan: Plan) => {
  const counts = {
    mkdirp: 0,
    write: 0,
    copy: 0,
    remove: 0
  };
  for (const op of plan.ops) {
    if (op.type === "Mkdirp") counts.mkdirp += 1;
    if (op.type === "WriteFile") counts.write += 1;
    if (op.type === "CopyDir") counts.copy += 1;
    if (op.type === "RemovePath") counts.remove += 1;
  }

  const parts: string[] = [];
  if (counts.mkdirp > 0) parts.push(cyan(`${counts.mkdirp} mkdir`));
  if (counts.write > 0) parts.push(green(`${counts.write} write`));
  if (counts.copy > 0) parts.push(green(`${counts.copy} copy`));
  if (counts.remove > 0) parts.push(red(`${counts.remove} remove`));

  if (parts.length === 0) {
    return dim("Plan: nothing to do");
  }

  return `Plan: ${parts.join(", ")}`;
};

export const renderWarnings = (warnings: string[]) =>
  warnings.length > 0
    ? `${yellow("Warnings:")}\n${warnings.map((w) => yellow(`  - ${w}`)).join("\n")}`
    : "";

export const renderGenSummary = (plan: Plan) => {
  const lines: string[] = [];
  const writeOps = plan.ops.filter((op) => op.type === "WriteFile");
  const copyOps = plan.ops.filter((op) => op.type === "CopyDir");
  const removeOps = plan.ops.filter((op) => op.type === "RemovePath");

  if (writeOps.length === 0 && copyOps.length === 0 && removeOps.length === 0) {
    return green("✓ Already in sync");
  }

  for (const op of writeOps) {
    if (op.type === "WriteFile") {
      const rel = path.basename(op.path);
      lines.push(green(`  + ${rel}`));
    }
  }

  for (const op of copyOps) {
    if (op.type === "CopyDir") {
      const rel = path.basename(op.to);
      const addCount = op.files.filter((f) => f.kind === "add").length;
      const updateCount = op.files.filter((f) => f.kind === "update").length;
      const removeCount = op.files.filter((f) => f.kind === "remove").length;
      const parts: string[] = [];
      if (addCount > 0) parts.push(`+${addCount}`);
      if (updateCount > 0) parts.push(`~${updateCount}`);
      if (removeCount > 0) parts.push(`-${removeCount}`);
      lines.push(cyan(`  ○ ${rel}/ ${dim(`(${parts.join(", ")})`)}`));
    }
  }

  for (const op of removeOps) {
    if (op.type === "RemovePath") {
      const rel = path.basename(op.path);
      lines.push(red(`  - ${rel}`));
    }
  }

  return green("✓ Synced") + "\n" + lines.join("\n");
};

const statusIcon = (status: FileStatus | "synced" | "outdated" | "missing") => {
  switch (status) {
    case "synced":
      return green("✓");
    case "outdated":
      return yellow("○");
    case "missing":
      return red("✗");
    case "unmanaged":
      return cyan("?");
    default:
      return " ";
  }
};

export const renderStatusReport = (report: StatusReport) => {
  const lines: string[] = [];

  if (!report.workspaceValid) {
    lines.push(red("✗ Workspace not found or invalid"));
    if (report.warnings.length > 0) {
      lines.push("");
      lines.push(renderWarnings(report.warnings));
    }
    return lines.join("\n");
  }

  const total = report.pendingWrites + report.pendingCopies + report.pendingRemoves;
  if (total === 0) {
    lines.push(green("✓ All targets in sync"));
  } else {
    lines.push(yellow(`○ ${total} pending operation${total !== 1 ? "s" : ""}`));
  }

  lines.push("");

  for (const target of report.targets) {
    const enabledLabel = target.enabled ? "" : dim(" (disabled)");
    lines.push(bold(`${target.name}${enabledLabel}`));

    const instIcon = statusIcon(target.instruction.status);
    lines.push(`  ${instIcon} ${target.instruction.path}`);

    const skillsIcon = statusIcon(target.skillsRoot.status);
    lines.push(`  ${skillsIcon} ${target.skillsRoot.path}/`);
  }

  if (report.warnings.length > 0) {
    lines.push("");
    lines.push(renderWarnings(report.warnings));
  }

  return lines.join("\n");
};

export const renderCleanResult = (result: CleanResult) => {
  const lines: string[] = [];
  const action = result.dryRun ? "Would remove" : "Removed";

  if (result.removed.length === 0 && result.skipped.length === 0) {
    return dim("Nothing to clean");
  }

  if (result.removed.length > 0) {
    lines.push(result.dryRun ? yellow(`${action}:`) : green(`${action}:`));
    for (const p of result.removed) {
      lines.push(result.dryRun ? yellow(`  - ${p}`) : red(`  - ${p}`));
    }
  }

  if (result.skipped.length > 0) {
    lines.push(yellow("Skipped (could not remove):"));
    for (const p of result.skipped) {
      lines.push(yellow(`  - ${p}`));
    }
  }

  const total = result.removed.length;
  lines.push("");
  lines.push(
    result.dryRun
      ? dim(`${total} file${total !== 1 ? "s" : ""} would be removed`)
      : green(`${total} file${total !== 1 ? "s" : ""} removed`)
  );

  return lines.join("\n");
};

export const renderDoctorReport = (report: DoctorReport) => {
  const lines: string[] = [];
  lines.push(`Repo root: ${report.repoRoot}`);
  lines.push("");

  // Workspace status
  lines.push(bold("Workspace:"));
  lines.push(`  ${statusIcon(report.workspacePresent ? "synced" : "missing")} .agentscfg/`);
  lines.push(`  ${statusIcon(report.configPresent ? "synced" : "missing")} agentscfg.jsonc`);
  lines.push(`  ${statusIcon(report.basePresent ? "synced" : "missing")} instructions/BASE.md`);
  lines.push(`  ${statusIcon(report.managedPresent ? "synced" : "missing")} .managed.json`);

  lines.push("");
  lines.push(bold("Targets:"));
  for (const [key, enabled] of Object.entries(report.targets)) {
    const icon = enabled ? green("✓") : dim("○");
    const label = enabled ? "enabled" : dim("disabled");
    lines.push(`  ${icon} ${key}: ${label}`);
  }

  lines.push("");
  lines.push(bold("Outputs:"));
  for (const [p, info] of Object.entries(report.outputs)) {
    const rel = p.includes(report.repoRoot)
      ? path.relative(report.repoRoot, p).replace(/\\/g, "/")
      : p;
    const icon = statusIcon(info.status);
    const statusLabel =
      info.status === "synced"
        ? green("synced")
        : info.status === "outdated"
          ? yellow("outdated")
          : red("missing");
    lines.push(`  ${icon} ${rel} ${dim(`(${statusLabel})`)}`);
  }

  return lines.join("\n");
};

export const renderImportSummary = (result: ImportResult) => {
  const lines: string[] = [];
  lines.push(green(`✓ Imported from ${result.from}`));

  const instructionParts = ["BASE.md"];
  if (result.instructions.project) instructionParts.push("PROJECT.md");
  lines.push(cyan(`  ○ instructions: ${instructionParts.join(", ")}`));

  lines.push(
    cyan(
      `  ○ skills: ${result.skills.files} file${result.skills.files === 1 ? "" : "s"}`
    )
  );
  lines.push(
    cyan(
      `  ○ targets: ${result.targets.files} file${result.targets.files === 1 ? "" : "s"}`
    )
  );

  lines.push(
    cyan(`  ○ mcp: ${result.mcp.copied ? "copied" : "not found"}`)
  );

  return lines.join("\n");
};
