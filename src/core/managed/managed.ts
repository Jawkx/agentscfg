import path from "node:path";
import { Effect } from "effect";
import { exists, readFileString, writeFileAtomic } from "../../io/fs";
import { IoError } from "../model/errors";
import { adapterSpecs } from "../../adapters";

export type ManagedFile = {
  version: 1;
  managed: string[];
  adopted?: Record<string, string>;
};

export const managedPath = (repoRoot: string) =>
  path.join(repoRoot, ".agentscfg", ".managed.json");

const legacyManaged = [
  "CLAUDE.md",
  "AGENTS.md",
  ".claude/settings.json",
  ".codex/config.toml",
  "opencode.json"
];

const managedFromSpecs = () => {
  const managed = new Set<string>();
  for (const spec of Object.values(adapterSpecs)) {
    managed.add(`${spec.targets.rel}/**`);
    if (spec.instruction?.mode === "generated") {
      managed.add(spec.instruction.rel);
    }
    if (spec.mcp?.rel) {
      managed.add(spec.mcp.rel);
    }
  }
  return Array.from(managed);
};

export const defaultManaged = (): ManagedFile => ({
  version: 1,
  managed: Array.from(new Set([...legacyManaged, ...managedFromSpecs()])).sort(),
  adopted: {}
});

export const readManaged = (repoRoot: string) =>
  Effect.gen(function* (_) {
    const pathToFile = managedPath(repoRoot);
    if (!(yield* _(exists(pathToFile)))) {
      return null;
    }
    const raw = yield* _(readFileString(pathToFile));
    try {
      const data = JSON.parse(raw) as ManagedFile;
      if (!data.managed) {
        throw new Error("Missing managed list");
      }
      return data;
    } catch (err) {
      return yield* _(
        Effect.fail(new IoError(`Invalid .managed.json`, String(err)))
      );
    }
  });

export const writeManaged = (repoRoot: string, data: ManagedFile) =>
  writeFileAtomic(
    managedPath(repoRoot),
    JSON.stringify(data, null, 2) + "\n"
  );

const normalizeRel = (relPath: string) => relPath.replace(/\\/g, "/");

export const isManagedPath = (repoRoot: string, targetPath: string, data: ManagedFile) => {
  const rel = normalizeRel(path.relative(repoRoot, targetPath));
  return data.managed.some((entry) => {
    if (entry.endsWith("/**")) {
      const prefix = entry.slice(0, -3);
      return rel === prefix || rel.startsWith(`${prefix}/`);
    }
    return rel === entry;
  });
};

export const addAdopted = (
  repoRoot: string,
  data: ManagedFile,
  paths: string[],
  now: Date
) => {
  const adopted = { ...(data.adopted ?? {}) };
  for (const p of paths) {
    const rel = normalizeRel(path.relative(repoRoot, p));
    adopted[rel] = now.toISOString();
  }
  return { ...data, adopted } satisfies ManagedFile;
};
