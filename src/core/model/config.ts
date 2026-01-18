import { Schema } from "effect";

export const TargetConfigSchema = Schema.Struct({
  enabled: Schema.optional(Schema.Boolean)
});

export const TargetsSchema = Schema.Struct({
  claude: Schema.optional(TargetConfigSchema),
  opencode: Schema.optional(TargetConfigSchema),
  codex: Schema.optional(TargetConfigSchema)
});

export const OutputSchema = Schema.Struct({
  newlines: Schema.optional(Schema.Union(Schema.Literal("lf"), Schema.Literal("crlf"))),
  charset: Schema.optional(Schema.Literal("utf-8"))
});

export const ManagedSchema = Schema.Struct({
  mode: Schema.optional(Schema.Union(Schema.Literal("guided"), Schema.Literal("strict"))),
  allowRemove: Schema.optional(Schema.Boolean)
});

export const InstructionsSchema = Schema.Struct({
  includeProjectSection: Schema.optional(Schema.Boolean),
  headerStyle: Schema.optional(Schema.Literal("generated"))
});

export const AgentCfgSchema = Schema.Struct({
  version: Schema.Literal(1),
  targets: Schema.optional(TargetsSchema),
  output: Schema.optional(OutputSchema),
  managed: Schema.optional(ManagedSchema),
  instructions: Schema.optional(InstructionsSchema)
});

export type AgentCfg = Schema.Schema.Type<typeof AgentCfgSchema>;

export type ResolvedAgentCfg = {
  version: 1;
  targets: {
    claude: { enabled: boolean };
    opencode: { enabled: boolean };
    codex: { enabled: boolean };
  };
  output: {
    newlines: "lf" | "crlf";
    charset: "utf-8";
  };
  managed: {
    mode: "guided" | "strict";
    allowRemove: boolean;
  };
  instructions: {
    includeProjectSection: boolean;
    headerStyle: "generated";
  };
};

export const withDefaults = (cfg: AgentCfg): ResolvedAgentCfg => {
  return {
    version: 1,
    targets: {
      claude: { enabled: cfg.targets?.claude?.enabled ?? true },
      opencode: { enabled: cfg.targets?.opencode?.enabled ?? true },
      codex: { enabled: cfg.targets?.codex?.enabled ?? true }
    },
    output: {
      newlines: cfg.output?.newlines ?? "lf",
      charset: "utf-8"
    },
    managed: {
      mode: cfg.managed?.mode ?? "guided",
      allowRemove: cfg.managed?.allowRemove ?? false
    },
    instructions: {
      includeProjectSection: cfg.instructions?.includeProjectSection ?? true,
      headerStyle: "generated"
    }
  };
};
