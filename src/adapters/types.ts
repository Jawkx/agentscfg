export type AdapterName = "claude" | "opencode" | "codex";

export type AdapterSpec = {
  instructionRel: string;
  skillsRel: string;
  targetsRel: string;
  mcpConfigRel: string;
};

export type AdapterPaths = {
  instructionPath: string;
  skillsRoot: string;
  targetsRoot: string;
  mcpConfigPath: string;
};

export type AllAdapterPaths = Record<AdapterName, AdapterPaths>;
