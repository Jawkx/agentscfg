import { Effect } from "effect";
import { IoError } from "../core/model/errors";

const runGit = async (args: string[], cwd: string) => {
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
