export type AdapterName = "claude" | "opencode" | "codex";

export type InstructionMode = "generated" | "in-targets" | "none";

export type InstructionSpec = {
  rel: string;
  mode: InstructionMode;
  title?: string;
};

export type AdapterSpec = {
  name: AdapterName;
  instruction?: InstructionSpec;
  skills: { rel: string };
  targets: { rel: string; excludeDirs?: string[] };
  mcp?: { rel: string };
};

export type AdapterPaths = {
  name: AdapterName;
  instructionPath?: string;
  instructionMode: InstructionMode;
  instructionTitle?: string;
  skillsRoot: string;
  targetsRoot: string;
  targetExcludeDirs: string[];
  mcpConfigPath?: string;
};

export type AllAdapterPaths = Record<AdapterName, AdapterPaths>;
