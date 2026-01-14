import path from "node:path";
import { Plan } from "../core/model/plan";
import { DoctorReport } from "./commands/doctor";

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
  return `Plan: ${counts.mkdirp} mkdir, ${counts.write} write, ${counts.copy} copy, ${counts.remove} remove`;
};

export const renderWarnings = (warnings: string[]) =>
  warnings.length > 0
    ? `Warnings:\n${warnings.map((w) => `- ${w}`).join("\n")}`
    : "";

export const renderDoctorReport = (report: DoctorReport) => {
  const lines: string[] = [];
  lines.push(`Repo root: ${report.repoRoot}`);
  lines.push(`Workspace present: ${report.workspacePresent}`);
  lines.push(`Config present: ${report.configPresent}`);
  lines.push(`Base instructions present: ${report.basePresent}`);
  lines.push(`Managed tracking present: ${report.managedPresent}`);
  lines.push("Targets:");
  for (const [key, value] of Object.entries(report.targets)) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push("Outputs:");
  for (const [p, value] of Object.entries(report.outputs)) {
    const rel = p.includes(report.repoRoot)
      ? path.relative(report.repoRoot, p).replace(/\\/g, "/")
      : p;
    lines.push(`- ${rel}: ${value}`);
  }
  return lines.join("\n");
};
