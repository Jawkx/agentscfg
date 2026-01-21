import type { AdapterSpec } from "../types";

export const opencodeSpec: AdapterSpec<"opencode"> = {
  name: "opencode",
  instruction: {
    rel: ".opencode/agent/default.md",
    mode: "in-targets"
  },
  skills: { rel: ".opencode/skill" },
  targets: { rel: ".opencode" },
  mcp: { rel: ".mcp.json" }
};
