import { describe, expect, test } from "vitest";
import { withDefaults, type AgentCfg } from "./config";

describe("withDefaults", () => {
  test("applies all defaults to minimal config", () => {
    const minimal: AgentCfg = { version: 1 };
    const resolved = withDefaults(minimal);

    expect(resolved).toEqual({
      version: 1,
      targets: {
        claude: { enabled: true },
        opencode: { enabled: true },
        codex: { enabled: true }
      },
      output: {
        newlines: "lf",
        charset: "utf-8"
      },
      managed: {
        mode: "guided",
        allowRemove: false
      },
      instructions: {
        includeProjectSection: true,
        headerStyle: "generated"
      }
    });
  });

  test("preserves explicit values", () => {
    const cfg: AgentCfg = {
      version: 1,
      targets: {
        claude: { enabled: false },
        codex: { enabled: true }
      },
      output: {
        newlines: "crlf"
      },
      managed: {
        mode: "strict",
        allowRemove: true
      }
    };
    const resolved = withDefaults(cfg);

    expect(resolved.targets.claude.enabled).toBe(false);
    expect(resolved.targets.codex.enabled).toBe(true);
    expect(resolved.targets.opencode.enabled).toBe(true); // default
    expect(resolved.output.newlines).toBe("crlf");
    expect(resolved.managed.mode).toBe("strict");
    expect(resolved.managed.allowRemove).toBe(true);
  });

  test("handles partial nested objects", () => {
    const cfg: AgentCfg = {
      version: 1,
      instructions: {
        includeProjectSection: false
      }
    };
    const resolved = withDefaults(cfg);

    expect(resolved.instructions.includeProjectSection).toBe(false);
    expect(resolved.instructions.headerStyle).toBe("generated");
  });
});
