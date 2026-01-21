import path from "node:path";
import fs from "node:fs/promises";
import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { applyPlan } from "./apply";
import type { Plan } from "../model/plan";
import { cleanupDir, makeTempDir, writeTextFile } from "../../test/utils";

describe("applyPlan", () => {
  test("writes files inside repo root", async () => {
    const repoRoot = await makeTempDir();
    try {
      const targetPath = path.join(repoRoot, "out.txt");
      const plan: Plan = {
        ops: [
          { type: "Mkdirp", path: repoRoot },
          {
            type: "WriteFile",
            path: targetPath,
            content: "hello\n",
            managed: true
          }
        ],
        warnings: []
      };

      await applyPlan(repoRoot, plan, {}).pipe(Effect.runPromise);
      const content = await fs.readFile(targetPath, "utf8");
      expect(content).toBe("hello\n");
    } finally {
      await cleanupDir(repoRoot);
    }
  });

  test("refuses to write outside repo root", async () => {
    const repoRoot = await makeTempDir();
    try {
      const outsidePath = path.join(repoRoot, "..", "outside.txt");
      const plan: Plan = {
        ops: [
          {
            type: "WriteFile",
            path: outsidePath,
            content: "nope\n",
            managed: true
          }
        ],
        warnings: []
      };

      await expect(
        applyPlan(repoRoot, plan, {}).pipe(Effect.runPromise)
      ).rejects.toThrow(/Refusing to write\/remove outside repo root/);
    } finally {
      await cleanupDir(repoRoot);
    }
  });

  test("does not remove when remove option is false", async () => {
    const repoRoot = await makeTempDir();
    try {
      const targetPath = path.join(repoRoot, "keep.txt");
      await writeTextFile(targetPath, "keep\n");

      const plan: Plan = {
        ops: [{ type: "RemovePath", path: targetPath }],
        warnings: []
      };

      await applyPlan(repoRoot, plan, { remove: false }).pipe(Effect.runPromise);
      const exists = await fs
        .access(targetPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    } finally {
      await cleanupDir(repoRoot);
    }
  });
});
