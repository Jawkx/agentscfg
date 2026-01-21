import { Effect } from "effect";
import type { AdapterPaths, AllAdapterPaths } from "./types";
import { resolveAdapterPathsFromSpec } from "./paths";
import { adapterSpecs, adapterSpecList } from "./specs";
import type { AdapterName } from "./specs";

export type {
  AdapterPaths,
  AllAdapterPaths,
  AdapterSpec,
  InstructionMode
} from "./types";
export type { AdapterName } from "./specs";
export { adapterSpecs, adapterSpecList } from "./specs";

export const resolveAdapterPaths = (repoRoot: string, name: AdapterName) =>
  resolveAdapterPathsFromSpec(repoRoot, adapterSpecs[name]);

export const resolveAllAdapterPaths = (repoRoot: string) => {
  const effects = Object.fromEntries(
    adapterSpecList.map((spec) => [
      spec.name,
      resolveAdapterPathsFromSpec(repoRoot, spec)
    ])
  ) as Record<AdapterName, Effect.Effect<AdapterPaths<AdapterName>, never, never>>;

  return Effect.all(effects) as Effect.Effect<
    AllAdapterPaths<AdapterName>,
    never,
    never
  >;
};
