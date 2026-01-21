import type { AdapterSpec } from "../types";

export const claudeSpec: AdapterSpec<"claude"> = {
  name: "claude",
  instruction: {
    rel: "CLAUDE.md",
    mode: "generated",
    title: "Claude Instructions"
  },
  skills: { rel: ".claude/skills" },
  targets: { rel: ".claude" },
  mcp: { rel: ".mcp.json" }
};
