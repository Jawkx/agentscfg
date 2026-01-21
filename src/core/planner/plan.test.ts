import path from "node:path";
import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { loadWorkspace } from "../model/workspace";
import { planWorkspace } from "./plan";
import { defaultManaged } from "../managed/managed";
import {
  makeTempDir,
  cleanupDir,
  writeJsonFile,
  writeTextFile
} from "../../test/utils";

const writeBaseWorkspace = async (repoRoot: string, config: object) => {
  await writeTextFile(
    path.join(repoRoot, ".agentscfg", "instructions", "BASE.md"),
    "# Base\n\nBase instructions.\n"
  );
  await writeJsonFile(
    path.join(repoRoot, ".agentscfg", "agentscfg.jsonc"),
    config
  );
};

describe("planWorkspace", () => {
  test("plans instruction and mcp writes", async () => {
    const repoRoot = await makeTempDir();
    try {
      await writeBaseWorkspace(repoRoot, {
        version: 1,
        targets: {
          claude: { enabled: false },
          opencode: { enabled: false },
          codex: { enabled: true }
        }
      });
      await writeJsonFile(
        path.join(repoRoot, ".agentscfg", ".managed.json"),
        defaultManaged()
      );
      await writeTextFile(
        path.join(repoRoot, ".agentscfg", "mcp", "mcp.json"),
        "{ \"tool\": \"mcp\" }\n"
      );

      const ws = await loadWorkspace(repoRoot).pipe(Effect.runPromise);
      const plan = await planWorkspace(ws, {}).pipe(Effect.runPromise);
      const writePaths = plan.ops
        .filter((op) => op.type === "WriteFile")
        .map((op) => (op as { path: string }).path);

      expect(writePaths).toContain(path.join(repoRoot, "AGENTS.md"));
      expect(writePaths).toContain(path.join(repoRoot, ".mcp.json"));
    } finally {
      await cleanupDir(repoRoot);
    }
  });

  test("plans skill copy operations", async () => {
    const repoRoot = await makeTempDir();
    try {
      await writeBaseWorkspace(repoRoot, {
        version: 1,
        targets: {
          claude: { enabled: false },
          opencode: { enabled: false },
          codex: { enabled: true }
        }
      });
      await writeJsonFile(
        path.join(repoRoot, ".agentscfg", ".managed.json"),
        defaultManaged()
      );
      await writeTextFile(
        path.join(
          repoRoot,
          ".agentscfg",
          "skills",
          "example-skill",
          "SKILL.md"
        ),
        "# Skill\n"
      );

      const ws = await loadWorkspace(repoRoot).pipe(Effect.runPromise);
      const plan = await planWorkspace(ws, {}).pipe(Effect.runPromise);
      const copyOps = plan.ops.filter((op) => op.type === "CopyDir") as Array<{
        to: string;
      }>;

      expect(copyOps.some((op) =>
        op.to === path.join(repoRoot, ".codex", "skills", "example-skill")
      )).toBe(true);
    } finally {
      await cleanupDir(repoRoot);
    }
  });

  test("rejects --remove when managed.allowRemove is false", async () => {
    const repoRoot = await makeTempDir();
    try {
      await writeBaseWorkspace(repoRoot, {
        version: 1,
        managed: { allowRemove: false },
        targets: {
          claude: { enabled: false },
          opencode: { enabled: false },
          codex: { enabled: true }
        }
      });

      const ws = await loadWorkspace(repoRoot).pipe(Effect.runPromise);
      await expect(
        planWorkspace(ws, { remove: true }).pipe(Effect.runPromise)
      ).rejects.toThrow(/Removal disabled/);
    } finally {
      await cleanupDir(repoRoot);
    }
  });
});
