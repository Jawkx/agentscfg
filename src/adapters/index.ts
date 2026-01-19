import { Effect } from "effect";
import type { AdapterName, AdapterPaths, AllAdapterPaths } from "./types";
import { adapterSpecs } from "./specs";
import { resolveAdapterPathsFromSpec } from "./paths";

export type {
  AdapterName,
  AdapterPaths,
  AllAdapterPaths,
  AdapterSpec,
  InstructionMode
} from "./types";
export { adapterSpecs } from "./specs";

export const resolveAdapterPaths = (repoRoot: string, name: AdapterName) =>
  resolveAdapterPathsFromSpec(repoRoot, adapterSpecs[name]);

export const resolveAllAdapterPaths = (repoRoot: string) => {
  const effects = {
    claude: resolveAdapterPathsFromSpec(repoRoot, adapterSpecs.claude),
    opencode: resolveAdapterPathsFromSpec(repoRoot, adapterSpecs.opencode),
    codex: resolveAdapterPathsFromSpec(repoRoot, adapterSpecs.codex)
  } satisfies Record<AdapterName, Effect.Effect<AdapterPaths, never, never>>;

  return Effect.all(effects) as Effect.Effect<AllAdapterPaths, never, never>;
};
