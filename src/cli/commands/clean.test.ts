import path from "node:path";
import fs from "node:fs/promises";
import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { cleanCommand } from "./clean";
import {
  cleanupDir,
  makeTempDir,
  writeJsonFile,
  writeTextFile,
  fileExists
} from "../../test/utils";

const writeWorkspace = async (repoRoot: string) => {
  await writeTextFile(
    path.join(repoRoot, ".agentscfg", "instructions", "BASE.md"),
    "# Base\n"
  );
  await writeJsonFile(
    path.join(repoRoot, ".agentscfg", "agentscfg.jsonc"),
    { version: 1 }
  );
};

describe("cleanCommand", () => {
  test("fails when managed tracking is missing", async () => {
    const repoRoot = await makeTempDir();
    try {
      await writeWorkspace(repoRoot);
      await expect(
        cleanCommand(repoRoot, true).pipe(Effect.runPromise)
      ).rejects.toThrow(/Managed tracking missing/);
    } finally {
      await cleanupDir(repoRoot);
    }
  });

  test("returns managed paths in dry-run without deleting", async () => {
    const repoRoot = await makeTempDir();
    try {
      await writeWorkspace(repoRoot);
      const managedPath = path.join(repoRoot, "managed.txt");
      await writeTextFile(managedPath, "managed\n");
      await writeJsonFile(
        path.join(repoRoot, ".agentscfg", ".managed.json"),
        { version: 1, managed: ["managed.txt"], adopted: {} }
      );

      const result = await cleanCommand(repoRoot, true).pipe(
        Effect.runPromise
      );
      expect(result.removed).toContain("managed.txt");
      expect(await fileExists(managedPath)).toBe(true);
    } finally {
      await cleanupDir(repoRoot);
    }
  });
});
