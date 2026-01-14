# agentscfg

Define AI coding agent configuration once in `.agentscfg/`, then generate equivalent
config for Claude Code, OpenCode, and Codex CLI.

## Install

```bash
npm install -g agentscfg
# or
npx agentscfg <command>
bunx agentscfg <command>
```

## Quick Start

```bash
agentscfg init
# edit .agentscfg/instructions/* and .agentscfg/skills/*
agentscfg plan
agentscfg diff
agentscfg gen
```

## Commands

```text
init [--force]
validate
plan [--to claude,opencode,codex] [--json]
diff [--to ...]
gen [--to ...] [--remove] [--adopt] [--force] [--allow-dirty]
doctor
```

Run `agentscfg <command> --help` for detailed help on each command.

## Canonical Layout

```
.agentscfg/
  agentscfg.jsonc
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

## Outputs

- Claude Code: `CLAUDE.md`, `.claude/skills/<skill>/...`
- OpenCode: `.opencode/agent/default.md`, `.opencode/skill/<skill>/...`
- Codex CLI: `AGENTS.md`, `.codex/skills/<skill>/...`

### Target Mappings

All files under `.agentscfg/targets/<tool>/` are generated into the tool's config
directory:

- `.agentscfg/targets/claude/**` → `.claude/**`
- `.agentscfg/targets/opencode/**` → `.opencode/**`
- `.agentscfg/targets/codex/**` → `.codex/**`

MCP config:

- `.agentscfg/mcp/mcp.json` → `.mcp.json`

## Managed Files

- Generated files include a `agentscfg:generated ... sha256=...` marker.
- Guided mode (default) will not overwrite unmanaged files unless you pass
  `--adopt` or the file already contains the marker.
- If a generated file's hash marker does not match, gen refuses to overwrite
  unless `--force` is provided.
- `gen` refuses to run on a dirty git working tree unless `--allow-dirty` is set.

## Tips

Add generated paths to `.gitignore` and use `agentscfg gen` to regenerate them:

```text
.claude/
.codex/
.opencode/
.mcp.json
AGENTS.md
CLAUDE.md
```

## Development

```bash
bun install
bun test
bun run build
```
