import { Effect } from "effect";
import type { AdapterName, AdapterPaths, AllAdapterPaths } from "./types";
import { resolveClaudeAdapterPaths } from "./claude";
import { resolveCodexAdapterPaths } from "./codex";
import { resolveOpenCodeAdapterPaths } from "./opencode";

export type { AdapterName, AdapterPaths, AllAdapterPaths } from "./types";

export const resolveAdapterPaths = (repoRoot: string, name: AdapterName) => {
  switch (name) {
    case "claude":
      return resolveClaudeAdapterPaths(repoRoot);
    case "opencode":
      return resolveOpenCodeAdapterPaths(repoRoot);
    case "codex":
      return resolveCodexAdapterPaths(repoRoot);
  }
};

export const resolveAllAdapterPaths = (repoRoot: string) => {
  const effects = {
    claude: resolveClaudeAdapterPaths(repoRoot),
    opencode: resolveOpenCodeAdapterPaths(repoRoot),
    codex: resolveCodexAdapterPaths(repoRoot)
  } satisfies Record<AdapterName, Effect.Effect<AdapterPaths, never, never>>;

  return Effect.all(effects) as Effect.Effect<AllAdapterPaths, never, never>;
};
