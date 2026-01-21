import path from "node:path";
import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { doctorCommand } from "./doctor";
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

describe("doctorCommand", () => {
  test("reports missing outputs for enabled targets only", async () => {
    const repoRoot = await makeTempDir();
    try {
      await writeWorkspace(repoRoot);
      const report = await doctorCommand(repoRoot).pipe(Effect.runPromise);

      const agentPath = path.join(repoRoot, "AGENTS.md");
      expect(report.outputs[agentPath]?.status).toBe("missing");

      const claudePath = path.join(repoRoot, "CLAUDE.md");
      expect(report.outputs[claudePath]).toBeUndefined();
    } finally {
      await cleanupDir(repoRoot);
    }
  });
});
