import path from "node:path";
import { Effect } from "effect";
import { readFileString, writeFileAtomic, exists, readdir, stat, copyFile, rm } from "../../io/fs";
import { shouldIncludePath } from "../../core/planner/skills";
import { WorkspaceMissing, InvalidConfig, IoError } from "../../core/model/errors";
import { claudeInstructionPath, claudeSkillsRoot, mcpConfigPath } from "../../adapters/claude";
import { codexInstructionPath, codexSkillsRoot } from "../../adapters/codex";
import { opencodeInstructionPath, opencodeSkillsRoot } from "../../adapters/opencode";

export type ImportSource = "claude" | "opencode" | "codex";

export type ImportResult = {
  from: ImportSource;
  instructions: { base: boolean; project: boolean; removedProject: boolean };
  skills: { files: number };
  targets: { files: number };
  mcp: { copied: boolean };
  warnings: string[];
};

const normalizeLf = (input: string) => input.replace(/\r\n?/g, "\n");

const ensureTrailingNewline = (input: string) =>
  input.endsWith("\n") ? input : `${input}\n`;

const stripGeneratedFooter = (lines: string[]) => {
  let end = lines.length;
  while (end > 0 && lines[end - 1]?.trim() === "") {
    end -= 1;
  }
  if (end > 0 && /agentscfg:generated/i.test(lines[end - 1] ?? "")) {
    end -= 1;
  }
  while (end > 0 && lines[end - 1]?.trim() === "") {
    end -= 1;
  }
  return lines.slice(0, end);
};

const normalizeSection = (lines: string[]) => {
  const trimmed = stripGeneratedFooter(lines);
  if (trimmed[0] === "") {
    trimmed.shift();
  }
  return trimmed.join("\n");
};

const extractInstructions = (content: string) => {
  const normalized = normalizeLf(content);
  const lines = normalized.split("\n");
  const baseIndex = lines.findIndex((line) => line.trim() === "## Base");
  if (baseIndex === -1) {
    const base = ensureTrailingNewline(
      stripGeneratedFooter(lines).join("\n")
    );
    return { base, project: undefined, parsed: false };
  }

  const projectIndex = lines.findIndex(
    (line, idx) => idx > baseIndex && line.trim() === "## Project"
  );
  const baseLines =
    projectIndex === -1
      ? lines.slice(baseIndex + 1)
      : lines.slice(baseIndex + 1, projectIndex);
  const base = ensureTrailingNewline(normalizeSection(baseLines));

  if (projectIndex === -1) {
    return { base, project: undefined, parsed: true };
  }

  const projectLines = lines.slice(projectIndex + 1);
  const project = ensureTrailingNewline(normalizeSection(projectLines));
  return { base, project, parsed: true };
};

type WalkFileEntry = { rel: string; abs: string; mode: number };

const walkFiles = (
  dirPath: string,
  baseRel = "",
  exclude?: (rel: string) => boolean
): Effect.Effect<WalkFileEntry[], IoError, never> =>
  Effect.gen(function* (_) {
    const results: WalkFileEntry[] = [];
    if (!(yield* _(exists(dirPath)))) {
      return results;
    }
    const entries = yield* _(readdir(dirPath));
    for (const entry of entries) {
      const nextRel = baseRel ? path.join(baseRel, entry.name) : entry.name;
      const nextRelNormalized = nextRel.replace(/\\/g, "/");
      if (!shouldIncludePath(nextRelNormalized)) {
        continue;
      }
      if (exclude && exclude(nextRelNormalized)) {
        continue;
      }
      const nextAbs = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const nested = yield* _(walkFiles(nextAbs, nextRel, exclude));
        results.push(...nested);
      } else if (entry.isFile()) {
        const st = yield* _(stat(nextAbs));
        results.push({
          rel: nextRelNormalized,
          abs: nextAbs,
          mode: st.mode
        });
      }
    }
    return results.sort((a, b) => a.rel.localeCompare(b.rel));
  });

const copyDir = (
  sourceRoot: string,
  destRoot: string,
  exclude?: (rel: string) => boolean
) =>
  Effect.gen(function* (_) {
    const files = yield* _(walkFiles(sourceRoot, "", exclude));
    for (const file of files) {
      const destPath = path.join(destRoot, file.rel);
      yield* _(copyFile(file.abs, destPath, file.mode));
    }
    return files.length;
  });

const ensureWorkspace = (repoRoot: string) =>
  Effect.gen(function* (_) {
    const root = path.join(repoRoot, ".agentscfg");
    if (!(yield* _(exists(root)))) {
      return yield* _(Effect.fail(new WorkspaceMissing()));
    }
    const configPath = path.join(root, "agentscfg.jsonc");
    if (!(yield* _(exists(configPath)))) {
      return yield* _(Effect.fail(new InvalidConfig("Missing agentscfg.jsonc")));
    }
    return {
      root,
      instructionsRoot: path.join(root, "instructions"),
      basePath: path.join(root, "instructions", "BASE.md"),
      projectPath: path.join(root, "instructions", "PROJECT.md"),
      skillsRoot: path.join(root, "skills"),
      targetsRoot: path.join(root, "targets"),
      mcpRoot: path.join(root, "mcp"),
      mcpPath: path.join(root, "mcp", "mcp.json")
    };
  });

const resolveSource = (repoRoot: string, from: ImportSource) => {
  switch (from) {
    case "claude":
      return {
        instructionPath: claudeInstructionPath(repoRoot),
        skillsRoot: claudeSkillsRoot(repoRoot),
        targetsRoot: path.join(repoRoot, ".claude")
      };
    case "opencode":
      return {
        instructionPath: opencodeInstructionPath(repoRoot),
        skillsRoot: opencodeSkillsRoot(repoRoot),
        targetsRoot: path.join(repoRoot, ".opencode")
      };
    case "codex":
      return {
        instructionPath: codexInstructionPath(repoRoot),
        skillsRoot: codexSkillsRoot(repoRoot),
        targetsRoot: path.join(repoRoot, ".codex")
      };
  }
};

const buildTargetExcludes = (from: ImportSource) => {
  if (from === "opencode") {
    return (rel: string) =>
      rel === "skill" ||
      rel.startsWith("skill/");
  }
  if (from === "claude" || from === "codex") {
    return (rel: string) => rel === "skills" || rel.startsWith("skills/");
  }
  return undefined;
};

export const importCommand = (repoRoot: string, from: string | boolean) =>
  Effect.gen(function* (_) {
    if (typeof from !== "string") {
      return yield* _(
        Effect.fail(new InvalidConfig("Missing --from (claude|opencode|codex)"))
      );
    }

    const source = from.trim().toLowerCase();
    if (source !== "claude" && source !== "opencode" && source !== "codex") {
      return yield* _(
        Effect.fail(new InvalidConfig("Invalid --from (claude|opencode|codex)"))
      );
    }

    const ws = yield* _(ensureWorkspace(repoRoot));
    const tool = source as ImportSource;
    const mapping = resolveSource(repoRoot, tool);
    const warnings: string[] = [];

    if (!(yield* _(exists(mapping.instructionPath)))) {
      return yield* _(
        Effect.fail(new IoError(`Missing source instructions at ${mapping.instructionPath}`))
      );
    }

    const instructionContent = yield* _(readFileString(mapping.instructionPath));
    const parsed = extractInstructions(instructionContent);

    yield* _(writeFileAtomic(ws.basePath, parsed.base));
    let projectWritten = false;
    let projectRemoved = false;
    if (parsed.project !== undefined) {
      yield* _(writeFileAtomic(ws.projectPath, parsed.project));
      projectWritten = true;
    } else if (yield* _(exists(ws.projectPath))) {
      yield* _(rm(ws.projectPath));
      projectRemoved = true;
    }

    let skillsCount = 0;
    if (yield* _(exists(mapping.skillsRoot))) {
      skillsCount = yield* _(copyDir(mapping.skillsRoot, ws.skillsRoot));
    } else {
      warnings.push(`No skills found at ${mapping.skillsRoot}`);
    }

    let targetsCount = 0;
    if (yield* _(exists(mapping.targetsRoot))) {
      const destRoot = path.join(ws.targetsRoot, tool);
      targetsCount = yield* _(
        copyDir(mapping.targetsRoot, destRoot, buildTargetExcludes(tool))
      );
    } else {
      warnings.push(`No target config found at ${mapping.targetsRoot}`);
    }

    let mcpCopied = false;
    const mcpSource = mcpConfigPath(repoRoot);
    if (yield* _(exists(mcpSource))) {
      yield* _(copyFile(mcpSource, ws.mcpPath));
      mcpCopied = true;
    }

    if (!parsed.parsed) {
      warnings.push("Instructions did not match generated format; imported as BASE.md");
    }

    return {
      from: tool,
      instructions: { base: true, project: projectWritten, removedProject: projectRemoved },
      skills: { files: skillsCount },
      targets: { files: targetsCount },
      mcp: { copied: mcpCopied },
      warnings
    } satisfies ImportResult;
  });
