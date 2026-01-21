import { describe, expect, test } from "vitest";
import { Effect } from "effect";
import { resolveAdapterPathsFromSpec } from "./paths";
import type { AdapterSpec } from "./types";

const repoRoot = "/repo";

const getExcludeDirs = (spec: AdapterSpec) =>
  Effect.runSync(resolveAdapterPathsFromSpec(repoRoot, spec)).targetExcludeDirs;

describe("resolveAdapterPathsFromSpec", () => {
  test("derives targetExcludeDirs from skills under targets", () => {
    const spec: AdapterSpec<"test"> = {
      name: "test",
      skills: { rel: ".codex/skills" },
      targets: { rel: ".codex" }
    };

    expect(getExcludeDirs(spec)).toEqual(["skills"]);
  });

  test("does not derive excludes when skills are outside targets", () => {
    const spec: AdapterSpec<"test"> = {
      name: "test",
      skills: { rel: ".codex-skills" },
      targets: { rel: ".codex" }
    };

    expect(getExcludeDirs(spec)).toEqual([]);
  });

  test("does not exclude when skills and targets are the same root", () => {
    const spec: AdapterSpec<"test"> = {
      name: "test",
      skills: { rel: ".codex" },
      targets: { rel: ".codex" }
    };

    expect(getExcludeDirs(spec)).toEqual([]);
  });

  test("merges explicit excludeDirs with derived ones", () => {
    const spec: AdapterSpec<"test"> = {
      name: "test",
      skills: { rel: ".codex/skills" },
      targets: { rel: ".codex", excludeDirs: ["custom"] }
    };

    const result = getExcludeDirs(spec).slice().sort();
    expect(result).toEqual(["custom", "skills"]);
  });
});
