import type { AdapterName, AdapterSpec } from "./types";

export const adapterSpecs: Record<AdapterName, AdapterSpec> = {
  claude: {
    name: "claude",
    instruction: {
      rel: "CLAUDE.md",
      mode: "generated",
      title: "Claude Instructions"
    },
    skills: { rel: ".claude/skills" },
    targets: { rel: ".claude", excludeDirs: ["skills"] },
    mcp: { rel: ".mcp.json" }
  },
  opencode: {
    name: "opencode",
    instruction: {
      rel: ".opencode/agent/default.md",
      mode: "in-targets"
    },
    skills: { rel: ".opencode/skill" },
    targets: { rel: ".opencode", excludeDirs: ["skill"] },
    mcp: { rel: ".mcp.json" }
  },
  codex: {
    name: "codex",
    instruction: {
      rel: "AGENTS.md",
      mode: "generated",
      title: "Agent Instructions"
    },
    skills: { rel: ".codex/skills" },
    targets: { rel: ".codex", excludeDirs: ["skills"] },
    mcp: { rel: ".mcp.json" }
  }
};
