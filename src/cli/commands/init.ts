import path from "node:path";
import { Effect } from "effect";
import { writeFileAtomic, mkdirp, exists, rm } from "../../io/fs";
import { IoError } from "../../core/model/errors";
import { defaultManaged } from "../../core/managed/managed";

const defaultConfig = `{
  "version": 1,
  "targets": {
    "claude": { "enabled": true },
    "opencode": { "enabled": true },
    "codex": { "enabled": true }
  },
  "output": {
    "newlines": "lf",
    "charset": "utf-8"
  },
  "managed": {
    "mode": "guided",
    "allowRemove": false
  },
  "instructions": {
    "includeProjectSection": true,
    "headerStyle": "generated"
  },
  "skills": {
    "emitClaudeCompatiblePathForOpenCode": true
  }
}
`;

const defaultBase = `# Base Instructions

Add your canonical instructions here.
`;

export const initCommand = (repoRoot: string, force: boolean) =>
  Effect.gen(function* (_) {
    const root = path.join(repoRoot, ".agentscfg");
    const existsRoot = yield* _(exists(root));
    if (existsRoot && !force) {
      return yield* _(
        Effect.fail(
          new IoError("Refusing to overwrite existing .agentscfg (use --force)")
        )
      );
    }
    if (existsRoot && force) {
      yield* _(rm(root));
    }

    yield* _(mkdirp(path.join(root, "instructions")));
    yield* _(mkdirp(path.join(root, "skills")));
    yield* _(mkdirp(path.join(root, "targets")));
    yield* _(mkdirp(path.join(root, "mcp")));

    yield* _(writeFileAtomic(path.join(root, "agentscfg.jsonc"), defaultConfig));
    yield* _(writeFileAtomic(path.join(root, "instructions", "BASE.md"), defaultBase));
    yield* _(
      writeFileAtomic(
        path.join(root, ".managed.json"),
        JSON.stringify(defaultManaged(), null, 2) + "\n"
      )
    );

    return root;
  });
