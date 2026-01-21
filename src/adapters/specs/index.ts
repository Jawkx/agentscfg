import { claudeSpec } from "./claude";
import { codexSpec } from "./codex";
import { opencodeSpec } from "./opencode";

export const adapterSpecList = [claudeSpec, codexSpec, opencodeSpec] as const;

export type AdapterName = (typeof adapterSpecList)[number]["name"];

export const adapterSpecs = Object.fromEntries(
  adapterSpecList.map((spec) => [spec.name, spec])
) as Record<AdapterName, (typeof adapterSpecList)[number]>;
