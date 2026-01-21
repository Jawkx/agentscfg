import { spawn } from "node:child_process";
import { Effect } from "effect";
import { IoError } from "../core/model/errors";

const runGitNode = (args: string[], cwd: string) =>
  new Promise<string>((resolve, reject) => {
    const proc = spawn("git", args, { cwd });

    let stdout = "";
    let stderr = "";

    proc.stdout?.setEncoding("utf8");
    proc.stderr?.setEncoding("utf8");

    proc.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });
    proc.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });

    proc.on("error", (err) => {
      reject(err);
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new IoError(`git ${args.join(" ")} failed: ${stderr.trim()}`));
        return;
      }
      resolve(stdout);
    });
  });

const runGit = (args: string[], cwd: string) => runGitNode(args, cwd);

export const isGitRepo = (repoRoot: string) =>
  Effect.tryPromise({
    try: async () => {
      try {
        await runGit(["rev-parse", "--is-inside-work-tree"], repoRoot);
        return true;
      } catch {
        return false;
      }
    },
    catch: (err) => new IoError("Failed to check git repo", String(err))
  });

export const isDirty = (repoRoot: string) =>
  Effect.tryPromise({
    try: async () => {
      const out = await runGit(["status", "--porcelain"], repoRoot);
      return out.trim().length > 0;
    },
    catch: (err) => new IoError("Failed to check git status", String(err))
  });
