import path from "node:path";
import fs from "node:fs/promises";
import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { importCommand } from "./import";
import {
  cleanupDir,
  makeTempDir,
  writeJsonFile,
  writeTextFile,
  fileExists
} from "../../test/utils";

const writeWorkspace = async (repoRoot: string) => {
  await writeJsonFile(
    path.join(repoRoot, ".agentscfg", "agentscfg.jsonc"),
    { version: 1 }
  );
};

describe("importCommand", () => {
  test("imports instructions, skills, and targets from codex", async () => {
    const repoRoot = await makeTempDir();
    try {
      await writeWorkspace(repoRoot);

      await writeTextFile(
        path.join(repoRoot, "AGENTS.md"),
        [
          "# Agent Instructions",
          "",
          "## Base",
          "Base line",
          "",
          "## Project",
          "Project line",
          "",
          "<!-- agentscfg:generated file=AGENTS.md source=BASE.md sha256=abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234 -->"
        ].join("\n")
      );

      await writeTextFile(
        path.join(repoRoot, ".codex", "skills", "demo-skill", "SKILL.md"),
        "# Demo Skill\n"
      );
      await writeTextFile(
        path.join(repoRoot, ".codex", "config.toml"),
        "setting = true\n"
      );

      const result = await importCommand(repoRoot, "codex").pipe(
        Effect.runPromise
      );

      const baseContent = await fs.readFile(
        path.join(repoRoot, ".agentscfg", "instructions", "BASE.md"),
        "utf8"
      );
      const projectContent = await fs.readFile(
        path.join(repoRoot, ".agentscfg", "instructions", "PROJECT.md"),
        "utf8"
      );

      expect(baseContent).toContain("Base line");
      expect(projectContent).toContain("Project line");
      expect(result.skills.files).toBeGreaterThan(0);
      expect(result.targets.files).toBeGreaterThan(0);
      expect(
        await fileExists(
          path.join(repoRoot, ".agentscfg", "skills", "demo-skill", "SKILL.md")
        )
      ).toBe(true);
      expect(
        await fileExists(
          path.join(repoRoot, ".agentscfg", "targets", "codex", "config.toml")
        )
      ).toBe(true);
    } finally {
      await cleanupDir(repoRoot);
    }
  });
});
