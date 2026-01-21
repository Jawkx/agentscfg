import type { AdapterSpec } from "../types";

export const codexSpec: AdapterSpec<"codex"> = {
  name: "codex",
  instruction: {
    rel: "AGENTS.md",
    mode: "generated",
    title: "Agent Instructions"
  },
  skills: { rel: ".codex/skills" },
  targets: { rel: ".codex", excludeDirs: ["skills"] },
  mcp: { rel: ".mcp.json" }
};
