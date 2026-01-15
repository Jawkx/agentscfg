import path from "node:path";
import { Effect } from "effect";
import { compileInstructions } from "../compile/instructions";
import type { Workspace } from "../model/workspace";
import type { Plan, PlanOp, PlanOptions, TargetName, CopyFileOp } from "../model/plan";
import type { ResolvedAgentCfg } from "../model/config";
import type { IoError } from "../model/errors";
import { exists, readFileString, readdir, stat } from "../../io/fs";
import { sha256File } from "../../io/hash";
import { extractMarkerSha } from "../managed/marker";
import {
  addAdopted,
  defaultManaged,
  isManagedPath,
  managedPath,
  readManaged
} from "../managed/managed";
import {
  claudeInstructionPath,
  claudeSkillsRoot,
  mcpConfigPath
} from "../../adapters/claude";
import {
  codexInstructionPath,
  codexSkillsRoot
} from "../../adapters/codex";
import {
  opencodeSkillsRoot,
  opencodeClaudeCompatSkillsRoot
} from "../../adapters/opencode";
import { shouldIncludePath } from "./skills";

const expectedOutputPaths = (repoRoot: string) =>
  new Set([
    claudeInstructionPath(repoRoot),
    codexInstructionPath(repoRoot),
    mcpConfigPath(repoRoot)
  ]);

const isExpectedOutput = (repoRoot: string, targetPath: string) =>
  expectedOutputPaths(repoRoot).has(targetPath);

const normalizeRel = (repoRoot: string, targetPath: string) =>
  path.relative(repoRoot, targetPath).replace(/\\/g, "/");

const normalizeLf = (input: string) => input.replace(/\r\n?/g, "\n");

const applyNewlines = (input: string, mode: "lf" | "crlf") =>
  mode === "crlf" ? input.replace(/\n/g, "\r\n") : input;

const ensureTrailingNewline = (input: string) =>
  input.endsWith("\n") ? input : `${input}\n`;

type WalkFileEntry = { rel: string; abs: string; mode: number };

const walkFiles = (
  dirPath: string,
  baseRel = ""
): Effect.Effect<WalkFileEntry[], IoError, never> =>
  Effect.gen(function* (_) {
    const results: WalkFileEntry[] = [];
    if (!(yield* _(exists(dirPath)))) {
      return results;
    }
    const entries = yield* _(readdir(dirPath));
    for (const entry of entries) {
      const nextRel = baseRel ? path.join(baseRel, entry.name) : entry.name;
      const nextAbs = path.join(dirPath, entry.name);
      if (!shouldIncludePath(nextRel)) {
        continue;
      }
      if (entry.isDirectory()) {
        const nested = yield* _(walkFiles(nextAbs, nextRel));
        results.push(...nested);
      } else if (entry.isFile()) {
        const st = yield* _(stat(nextAbs));
        results.push({ rel: nextRel.replace(/\\/g, "/"), abs: nextAbs, mode: st.mode });
      }
    }
    return results.sort((a, b) => a.rel.localeCompare(b.rel));
  });

const planWriteFile = (
  repoRoot: string,
  managedData: ReturnType<typeof defaultManaged> | null,
  targetPath: string,
  content: string,
  sha: string | undefined,
  options: PlanOptions
) =>
  Effect.gen(function* (_) {
    const warnings: string[] = [];
    const existsNow = yield* _(exists(targetPath));
    let current = "";
    if (existsNow) {
      current = yield* _(readFileString(targetPath));
    }

    const markerSha = current ? extractMarkerSha(current) : null;
    if (markerSha && sha && markerSha !== sha && !options.force) {
      warnings.push(
        `Refusing to overwrite ${normalizeRel(repoRoot, targetPath)}: generated marker hash mismatch.`
      );
      return { op: null, warnings, adopted: false };
    }

    const managed = managedData
      ? isManagedPath(repoRoot, targetPath, managedData)
      : false;

    const expected = isExpectedOutput(repoRoot, targetPath);
    const canAdopt = expected && (options.adopt || markerSha !== null);

    if (existsNow && current === content) {
      return { op: null, warnings, adopted: !managed && canAdopt };
    }

    if (existsNow && !managed && !canAdopt) {
      warnings.push(
        `Skipping ${normalizeRel(repoRoot, targetPath)}: not managed and adoption not allowed.`
      );
      return { op: null, warnings, adopted: false };
    }

    const op: PlanOp = {
      type: "WriteFile",
      path: targetPath,
      content,
      sha,
      managed: managed || canAdopt,
      adopt: !managed && canAdopt
    };

    return { op, warnings, adopted: !managed && canAdopt };
  });

const buildSkillTargets = (
  repoRoot: string,
  cfg: ResolvedAgentCfg,
  targets: Set<TargetName>
) => {
  const result: { name: TargetName | "opencode-compat"; root: string }[] = [];
  if (targets.has("claude")) {
    result.push({ name: "claude", root: claudeSkillsRoot(repoRoot) });
  }
  if (targets.has("opencode")) {
    result.push({ name: "opencode", root: opencodeSkillsRoot(repoRoot) });
    if (cfg.skills.emitClaudeCompatiblePathForOpenCode) {
      result.push({
        name: "opencode-compat",
        root: opencodeClaudeCompatSkillsRoot(repoRoot)
      });
    }
  }
  if (targets.has("codex")) {
    result.push({ name: "codex", root: codexSkillsRoot(repoRoot) });
  }
  const dedup = new Map<string, { name: string; root: string }>();
  for (const entry of result) {
    if (!dedup.has(entry.root)) {
      dedup.set(entry.root, entry);
    }
  }
  return Array.from(dedup.values()).sort((a, b) =>
    a.root.localeCompare(b.root)
  );
};

const diffDir = (
  sourceDir: string,
  targetDir: string,
  remove: boolean
): Effect.Effect<CopyFileOp[], IoError, never> =>
  Effect.gen(function* (_) {
    const sourceFiles = yield* _(walkFiles(sourceDir));
    const destFiles = yield* _(walkFiles(targetDir));

    const sourceMap = new Map(sourceFiles.map((f) => [f.rel, f]));
    const destMap = new Map(destFiles.map((f) => [f.rel, f]));

    const ops: CopyFileOp[] = [];

    for (const [rel, src] of sourceMap) {
      const dest = destMap.get(rel);
      if (!dest) {
        ops.push({
          rel,
          from: src.abs,
          to: path.join(targetDir, rel),
          mode: src.mode,
          kind: "add"
        });
      } else {
        const [srcHash, destHash] = yield* _(
          Effect.all([
            sha256File(src.abs),
            sha256File(dest.abs)
          ])
        );
        if (srcHash !== destHash) {
          ops.push({
            rel,
            from: src.abs,
            to: dest.abs,
            mode: src.mode,
            kind: "update"
          });
        }
      }
    }

    if (remove) {
      for (const [rel, dest] of destMap) {
        if (!sourceMap.has(rel)) {
          ops.push({
            rel,
            from: dest.abs,
            to: dest.abs,
            mode: dest.mode,
            kind: "remove"
          });
        }
      }
    }

    return ops.sort((a, b) => a.rel.localeCompare(b.rel));
  });

const resolveTargets = (cfg: ResolvedAgentCfg, options: PlanOptions) => {
  if (options.targets && options.targets.size > 0) {
    return options.targets;
  }
  const active = new Set<TargetName>();
  if (cfg.targets.claude.enabled) active.add("claude");
  if (cfg.targets.opencode.enabled) active.add("opencode");
  if (cfg.targets.codex.enabled) active.add("codex");
  return active;
};

export const planWorkspace = (ws: Workspace, options: PlanOptions) =>
  Effect.gen(function* (_) {
    const targets = resolveTargets(ws.cfg, options);
    const managedData = yield* _(readManaged(ws.repoRoot));

    const instructionOutputs = yield* _(
      compileInstructions(ws.cfg, ws.instructions, {
        claude: targets.has("claude")
          ? claudeInstructionPath(ws.repoRoot)
          : undefined,
        codex: targets.has("codex")
          ? codexInstructionPath(ws.repoRoot)
          : undefined
      })
    );

    const normalizeOutputContent = (input: string) =>
      applyNewlines(
        ensureTrailingNewline(normalizeLf(input)),
        ws.cfg.output.newlines
      );

    const extraOutputs: { path: string; content: string }[] = [];
    if (ws.mcp && targets.size > 0) {
      extraOutputs.push({
        path: mcpConfigPath(ws.repoRoot),
        content: normalizeOutputContent(ws.mcp.content)
      });
    }

    const warnings: string[] = [];
    const ops: PlanOp[] = [];
    const mkdirs = new Set<string>();
    const adopted: string[] = [];

    for (const output of instructionOutputs.outputs) {
      const result = yield* _(
        planWriteFile(
          ws.repoRoot,
          managedData ?? null,
          output.path,
          output.content,
          output.sha,
          options
        )
      );
      warnings.push(...result.warnings);
      if (result.op) {
        mkdirs.add(path.dirname(output.path));
        ops.push(result.op);
      }
      if (result.adopted) {
        adopted.push(output.path);
      }
    }

    for (const output of extraOutputs) {
      const result = yield* _(
        planWriteFile(
          ws.repoRoot,
          managedData ?? null,
          output.path,
          output.content,
          undefined,
          options
        )
      );
      warnings.push(...result.warnings);
      if (result.op) {
        mkdirs.add(path.dirname(output.path));
        ops.push(result.op);
      }
      if (result.adopted) {
        adopted.push(output.path);
      }
    }

    const skillTargets = buildSkillTargets(ws.repoRoot, ws.cfg, targets);
    for (const skill of ws.skills) {
      for (const target of skillTargets) {
        const destDir = path.join(target.root, skill.name);
        const managed = managedData
          ? isManagedPath(ws.repoRoot, destDir, managedData)
          : false;

        const destExists = yield* _(exists(destDir));
        if (destExists && !managed && managedData) {
          warnings.push(
            `Skipping ${normalizeRel(ws.repoRoot, destDir)}: not managed.`
          );
          continue;
        }
        if (!managedData && destExists) {
          warnings.push(
            `Managed tracking missing for ${normalizeRel(
              ws.repoRoot,
              destDir
            )}. Run gen with --adopt to establish ownership.`
          );
          continue;
        }

        const diffOps = yield* _(diffDir(skill.dir, destDir, !!options.remove));
        if (diffOps.length > 0) {
          mkdirs.add(destDir);
          ops.push({
            type: "CopyDir",
            from: skill.dir,
            to: destDir,
            files: diffOps
          });
        }
      }
    }

    const targetDirMappings = [
      {
        name: "claude" as TargetName,
        source: path.join(ws.root, "targets", "claude"),
        dest: path.join(ws.repoRoot, ".claude")
      },
      {
        name: "opencode" as TargetName,
        source: path.join(ws.root, "targets", "opencode"),
        dest: path.join(ws.repoRoot, ".opencode")
      },
      {
        name: "codex" as TargetName,
        source: path.join(ws.root, "targets", "codex"),
        dest: path.join(ws.repoRoot, ".codex")
      }
    ];

    for (const mapping of targetDirMappings) {
      if (!targets.has(mapping.name)) continue;
      if (!(yield* _(exists(mapping.source)))) continue;

      const destExists = yield* _(exists(mapping.dest));
      const managed = managedData
        ? isManagedPath(ws.repoRoot, mapping.dest, managedData)
        : false;
      if (destExists && managedData && !managed) {
        warnings.push(
          `Skipping ${normalizeRel(ws.repoRoot, mapping.dest)}: not managed.`
        );
        continue;
      }
      if (destExists && !managedData) {
        warnings.push(
          `Managed tracking missing for ${normalizeRel(
            ws.repoRoot,
            mapping.dest
          )}. Run gen with --adopt to establish ownership.`
        );
        continue;
      }

      const diffOps = yield* _(diffDir(mapping.source, mapping.dest, !!options.remove));
      if (diffOps.length > 0) {
        mkdirs.add(mapping.dest);
        ops.push({
          type: "CopyDir",
          from: mapping.source,
          to: mapping.dest,
          files: diffOps
        });
      }
    }

    if (options.remove) {
      const skillNames = new Set(ws.skills.map((skill) => skill.name));
      for (const target of skillTargets) {
        if (!(yield* _(exists(target.root)))) continue;
        const entries = yield* _(readdir(target.root));
        const dirs = entries.filter((entry) => entry.isDirectory());
        for (const dir of dirs) {
          if (skillNames.has(dir.name)) continue;
          const removePath = path.join(target.root, dir.name);
          if (managedData && isManagedPath(ws.repoRoot, removePath, managedData)) {
            ops.push({ type: "RemovePath", path: removePath });
          } else if (!managedData) {
            warnings.push(
              `Managed tracking missing for ${normalizeRel(
                ws.repoRoot,
                removePath
              )}. Run gen with --adopt to establish ownership.`
            );
          } else {
            warnings.push(
              `Skipping removal of ${normalizeRel(
                ws.repoRoot,
                removePath
              )}: not managed.`
            );
          }
        }
      }
    }

    const managedPathValue = managedPath(ws.repoRoot);
    if (!managedData && options.adopt) {
      const base = defaultManaged();
      const updated = adopted.length
        ? addAdopted(ws.repoRoot, base, adopted, new Date())
        : base;
      mkdirs.add(path.dirname(managedPathValue));
      ops.push({
        type: "WriteFile",
        path: managedPathValue,
        content: JSON.stringify(updated, null, 2) + "\n",
        managed: true
      });
    } else if ((options.adopt || !managedData) && adopted.length > 0) {
      const base = managedData ?? defaultManaged();
      const updated = addAdopted(ws.repoRoot, base, adopted, new Date());
      mkdirs.add(path.dirname(managedPathValue));
      ops.push({
        type: "WriteFile",
        path: managedPathValue,
        content: JSON.stringify(updated, null, 2) + "\n",
        managed: true
      });
    } else if (!managedData) {
      warnings.push(
        "managed tracking missing; run gen with --adopt to establish ownership"
      );
    }

    const orderedMkdirs = Array.from(mkdirs)
      .filter((dir) => dir && dir !== ".")
      .sort((a, b) => a.localeCompare(b));

    const orderedOps: PlanOp[] = [];
    for (const dir of orderedMkdirs) {
      orderedOps.push({ type: "Mkdirp", path: dir });
    }

    const writeOps = ops.filter((op) => op.type === "WriteFile") as PlanOp[];
    const copyOps = ops.filter((op) => op.type === "CopyDir") as PlanOp[];
    const removeOps = ops.filter((op) => op.type === "RemovePath") as PlanOp[];

    const sortedWriteOps = writeOps.sort((a, b) =>
      a.type === "WriteFile" && b.type === "WriteFile"
        ? a.path.localeCompare(b.path)
        : 0
    );
    const sortedCopyOps = copyOps.sort((a, b) =>
      a.type === "CopyDir" && b.type === "CopyDir"
        ? a.to.localeCompare(b.to)
        : 0
    );

    const sortedRemoveOps = removeOps.sort((a, b) =>
      a.type === "RemovePath" && b.type === "RemovePath"
        ? a.path.localeCompare(b.path)
        : 0
    );

    orderedOps.push(...sortedWriteOps, ...sortedCopyOps, ...sortedRemoveOps);

    return {
      ops: orderedOps,
      warnings
    } satisfies Plan;
  });
