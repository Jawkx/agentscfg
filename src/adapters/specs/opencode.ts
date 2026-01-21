import type { AdapterSpec } from "../types";

export const opencodeSpec: AdapterSpec<"opencode"> = {
  name: "opencode",
  instruction: {
    rel: ".opencode/agent/default.md",
    mode: "in-targets"
  },
  skills: { rel: ".opencode/skill" },
  targets: { rel: ".opencode", excludeDirs: ["skill"] },
  mcp: { rel: ".mcp.json" }
};
