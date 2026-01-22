import path from "node:path";
import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { genCommand } from "./gen";
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
    "# Base\n\nBase instructions.\n"
  );
  await writeJsonFile(
    path.join(repoRoot, ".agentscfg", "agentscfg.jsonc"),
    {
      version: 1,
      targets: {
        claude: { enabled: false },
        opencode: { enabled: false },
        codex: { enabled: true }
      }
    }
  );
};

describe("genCommand", () => {
  test("fails when managed tracking is missing and --adopt is not set", async () => {
    const repoRoot = await makeTempDir();
    try {
      await writeWorkspace(repoRoot);
      await expect(
        genCommand(repoRoot, { adopt: false }).pipe(Effect.runPromise)
      ).rejects.toThrow(/Managed tracking missing/);
    } finally {
      await cleanupDir(repoRoot);
    }
  });

  test("creates managed tracking when --adopt is set", async () => {
    const repoRoot = await makeTempDir();
    try {
      await writeWorkspace(repoRoot);
      await genCommand(repoRoot, { adopt: true }).pipe(Effect.runPromise);

      expect(
        await fileExists(path.join(repoRoot, ".agentscfg", ".managed.json"))
      ).toBe(true);
      expect(await fileExists(path.join(repoRoot, "AGENTS.md"))).toBe(true);
    } finally {
      await cleanupDir(repoRoot);
    }
  });

  test("dry-run does not write outputs", async () => {
    const repoRoot = await makeTempDir();
    try {
      await writeWorkspace(repoRoot);
      await genCommand(repoRoot, { dryRun: true }).pipe(Effect.runPromise);
      expect(await fileExists(path.join(repoRoot, "AGENTS.md"))).toBe(false);
    } finally {
      await cleanupDir(repoRoot);
    }
  });
});
