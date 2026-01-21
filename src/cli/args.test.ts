import { describe, expect, test } from "vitest";
import { parseArgs, parseTargets, buildOptions } from "./args";

describe("parseArgs", () => {
  test("parses command only", () => {
    const result = parseArgs(["gen"]);
    expect(result.command).toBe("gen");
    expect(result.flags).toEqual({});
    expect(result.positionals).toEqual([]);
  });

  test("returns help for empty args", () => {
    const result = parseArgs([]);
    expect(result.command).toBe("help");
  });

  test("parses boolean flags", () => {
    const result = parseArgs(["gen", "--force", "--remove"]);
    expect(result.command).toBe("gen");
    expect(result.flags["--force"]).toBe(true);
    expect(result.flags["--remove"]).toBe(true);
  });

  test("parses --to with value", () => {
    const result = parseArgs(["plan", "--to", "claude,opencode"]);
    expect(result.flags["--to"]).toBe("claude,opencode");
  });

  test("parses --flag=value syntax", () => {
    const result = parseArgs(["plan", "--to=claude"]);
    expect(result.flags["--to"]).toBe("claude");
  });

  test("parses positional arguments", () => {
    const result = parseArgs(["init", "my-project"]);
    expect(result.command).toBe("init");
    expect(result.positionals).toEqual(["my-project"]);
  });

  test("parses mixed flags and positionals", () => {
    const result = parseArgs(["gen", "--force", "path/to/file", "--remove"]);
    expect(result.flags["--force"]).toBe(true);
    expect(result.flags["--remove"]).toBe(true);
    expect(result.positionals).toEqual(["path/to/file"]);
  });
});

describe("parseTargets", () => {
  test("returns undefined for undefined input", () => {
    expect(parseTargets(undefined)).toBeUndefined();
  });

  test("returns undefined for empty string", () => {
    expect(parseTargets("")).toBeUndefined();
  });

  test("parses single target", () => {
    const result = parseTargets("claude");
    expect(result).toEqual(new Set(["claude"]));
  });

  test("parses multiple targets", () => {
    const result = parseTargets("claude,opencode,codex");
    expect(result).toEqual(new Set(["claude", "opencode", "codex"]));
  });

  test("handles whitespace", () => {
    const result = parseTargets("claude, opencode , codex");
    expect(result).toEqual(new Set(["claude", "opencode", "codex"]));
  });

  test("ignores invalid targets", () => {
    const result = parseTargets("claude,invalid,opencode");
    expect(result).toEqual(new Set(["claude", "opencode"]));
  });

  test("returns undefined if all targets invalid", () => {
    expect(parseTargets("invalid,unknown")).toBeUndefined();
  });
});

describe("buildOptions", () => {
  test("builds default options from empty flags", () => {
    const result = buildOptions({});
    expect(result).toEqual({
      targets: undefined,
      remove: false,
      adopt: false,
      force: false,
      allowDirty: false
    });
  });

  test("builds options with all flags", () => {
    const result = buildOptions({
      "--to": "claude,codex",
      "--remove": true,
      "--adopt": true,
      "--force": true,
      "--allow-dirty": true
    });
    expect(result.targets).toEqual(new Set(["claude", "codex"]));
    expect(result.remove).toBe(true);
    expect(result.adopt).toBe(true);
    expect(result.force).toBe(true);
    expect(result.allowDirty).toBe(true);
  });
});
