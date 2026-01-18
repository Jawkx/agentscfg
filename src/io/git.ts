import { spawn } from "node:child_process";
import { Effect } from "effect";
import { IoError } from "../core/model/errors";

type BunLike = {
  spawn: (
    cmd: string[],
    opts: { cwd: string; stdout: "pipe"; stderr: "pipe" }
  ) => {
    stdout: ReadableStream;
    stderr: ReadableStream;
    exited: Promise<number>;
  };
};

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

const runGitBun = async (args: string[], cwd: string, Bun: BunLike) => {
  const proc = Bun.spawn(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text()
  ]);
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new IoError(`git ${args.join(" ")} failed: ${stderr.trim()}`);
  }
  return stdout;
};

const runGit = async (args: string[], cwd: string) => {
  const bun = (globalThis as unknown as { Bun?: BunLike }).Bun;
  if (bun) {
    return runGitBun(args, cwd, bun);
  }
  return runGitNode(args, cwd);
};

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
