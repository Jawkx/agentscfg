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
  targets/
    claude/
    opencode/
    codex/
  mcp/
    mcp.json
  .managed.json
```

## Supported inputs (v0.2)

- Instructions: `.agentcfg/instructions/BASE.md` (+ optional `PROJECT.md`)
- Skills: `.agentcfg/skills/<skill>/SKILL.md` (+ optional resources)
- Targets (tool settings): `.agentcfg/targets/<tool>/**`
- MCP config: `.agentcfg/mcp/mcp.json`

## Outputs (repo-only)

- Claude Code: `CLAUDE.md`, `.claude/skills/<skill>/...`
- OpenCode: `.opencode/agent/default.md`, `.opencode/skill/<skill>/...`
  - plus a Claude-compatible skills path in `.claude/skills/<skill>/...`
- Codex CLI: `AGENTS.md`, `.codex/skills/<skill>/...`

### Target mappings

All files under `.agentcfg/targets/<tool>/` are synced into the tool’s config
directory:

- `.agentcfg/targets/claude/**` → `.claude/**`
- `.agentcfg/targets/opencode/**` → `.opencode/**`
- `.agentcfg/targets/codex/**` → `.codex/**`

Legacy single-file mappings are also supported:

- `.agentcfg/targets/claude.settings.json` → `.claude/settings.json`
- `.agentcfg/targets/opencode.json` → `opencode.json`
- `.agentcfg/targets/codex.config.toml` → `.codex/config.toml`

MCP is synced separately:

- `.agentcfg/mcp/mcp.json` → `.mcp.json`

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
