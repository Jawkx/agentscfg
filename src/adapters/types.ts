export type InstructionMode = "generated" | "in-targets" | "none";

export type InstructionSpec = {
  rel: string;
  mode: InstructionMode;
  title?: string;
};

export type AdapterSpec<Name extends string = string> = {
  name: Name;
  instruction?: InstructionSpec;
  skills: { rel: string };
  targets: { rel: string; excludeDirs?: string[] };
  mcp?: { rel: string };
};

export type AdapterPaths<Name extends string = string> = {
  name: Name;
  instructionPath?: string;
  instructionMode: InstructionMode;
  instructionTitle?: string;
  skillsRoot: string;
  targetsRoot: string;
  targetExcludeDirs: string[];
  mcpConfigPath?: string;
};

export type AllAdapterPaths<Name extends string = string> = Record<
  Name,
  AdapterPaths<Name>
>;
