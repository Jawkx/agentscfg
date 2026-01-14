# agentcfg

Define AI coding agent configuration once in `.agentcfg/`, then generate equivalent
config for Claude Code, OpenCode, and Codex CLI.

## Requirements

- Bun (v1.2+)

## Install

```bash
bun install
```

## Run

```bash
bun run index.ts <command> [flags]
```

## Typical workflow

```bash
bun run index.ts init
# edit .agentcfg/instructions/* and .agentcfg/skills/*
bun run index.ts plan
bun run index.ts diff
bun run index.ts sync
```

## Commands

```text
init [--force]
validate
plan [--to claude,opencode,codex] [--json]
diff [--to ...]
sync [--to ...] [--remove] [--adopt] [--force] [--allow-dirty]
doctor
```

## Canonical layout

```
.agentcfg/
  agentcfg.jsonc
  instructions/
    BASE.md
    PROJECT.md
  skills/
    <skill-name>/
      SKILL.md
      scripts/
      references/
      assets/
  .managed.json
```

## Outputs (repo-only, v0.1)

- Claude Code: `CLAUDE.md`, `.claude/skills/<skill>/...`
- OpenCode: `.opencode/agent/default.md`, `.opencode/skill/<skill>/...`
  - plus a Claude-compatible skills path in `.claude/skills/<skill>/...`
- Codex CLI: `AGENTS.md`, `.codex/skills/<skill>/...`

## Managed files + adoption

- Generated files include a `agentcfg:generated ... sha256=...` marker.
- Guided mode (default) will not overwrite unmanaged files unless you pass
  `--adopt` or the file already contains the marker.
- If a generated file’s hash marker does not match, sync refuses to overwrite
  unless `--force` is provided.
- `sync` refuses to run on a dirty git working tree unless `--allow-dirty` is set.

## Notes

- v0.1 is repo-only (no global/HOME sync).
- `agentcfg init` creates a starter `.agentcfg/` workspace.

## Tips

- The following paths are managed by agentcfg. Add them to `.gitignore` and use `agentcfg sync` to regenerate them:

```text
.claude/
.codex/
.opencode/
AGENTS.md
CLAUDE.md
```
