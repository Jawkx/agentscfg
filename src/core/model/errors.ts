export class RepoRootNotFound extends Error {
  readonly _tag = "RepoRootNotFound";
  constructor(message = "Repository root not found") {
    super(message);
  }
}

export class WorkspaceMissing extends Error {
  readonly _tag = "WorkspaceMissing";
  constructor(message = "Canonical workspace .agentcfg not found") {
    super(message);
  }
}

export class InvalidConfig extends Error {
  readonly _tag = "InvalidConfig";
  readonly details?: string;
  constructor(message: string, details?: string) {
    super(message);
    this.details = details;
  }
}

export class InvalidSkill extends Error {
  readonly _tag = "InvalidSkill";
  constructor(message: string) {
    super(message);
  }
}

export class IoError extends Error {
  readonly _tag = "IoError";
  readonly path?: string;
  constructor(message: string, path?: string) {
    super(message);
    this.path = path;
  }
}

export class OwnershipError extends Error {
  readonly _tag = "OwnershipError";
  constructor(message: string) {
    super(message);
  }
}

export class DirtyRepoError extends Error {
  readonly _tag = "DirtyRepoError";
  constructor(message: string) {
    super(message);
  }
}
