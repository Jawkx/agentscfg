import path from "node:path";
import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { statusCommand } from "./status";
import { defaultManaged } from "../../core/managed/managed";
import {
  cleanupDir,
  makeTempDir,
  writeJsonFile,
  writeTextFile
} from "../../test/utils";

const writeWorkspace = async (repoRoot: string) => {
  await writeTextFile(
    path.join(repoRoot, ".agentscfg", "instructions", "BASE.md"),
    "# Base\n"
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
  await writeJsonFile(
    path.join(repoRoot, ".agentscfg", ".managed.json"),
    defaultManaged()
  );
};

describe("statusCommand", () => {
  test("reports missing instruction output as pending", async () => {
    const repoRoot = await makeTempDir();
    try {
      await writeWorkspace(repoRoot);
      const report = await statusCommand(repoRoot, {}).pipe(
        Effect.runPromise
      );

      expect(report.workspaceValid).toBe(true);
      expect(report.pendingWrites).toBeGreaterThan(0);
      const codexTarget = report.targets.find((t) => t.name === "codex");
      expect(codexTarget?.instruction?.status).toBe("missing");
      expect(codexTarget?.instruction?.path).toBe("AGENTS.md");
    } finally {
      await cleanupDir(repoRoot);
    }
  });
});
