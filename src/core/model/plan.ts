export type TargetName = "claude" | "opencode" | "codex";

export type CopyFileOp = {
  rel: string;
  from: string;
  to: string;
  mode?: number;
  kind: "add" | "update" | "remove";
};

export type PlanOp =
  | { type: "Mkdirp"; path: string }
  | {
      type: "WriteFile";
      path: string;
      content: string;
      sha?: string;
      adopt?: boolean;
      managed: boolean;
    }
  | { type: "CopyDir"; from: string; to: string; files: CopyFileOp[] }
  | { type: "RemovePath"; path: string };

export type Plan = {
  ops: PlanOp[];
  warnings: string[];
};

export type PlanOptions = {
  targets?: Set<TargetName>;
  remove?: boolean;
  adopt?: boolean;
  force?: boolean;
  allowDirty?: boolean;
  dryRun?: boolean;
};
