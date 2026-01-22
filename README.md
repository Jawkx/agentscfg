# agentscfg

Define AI coding agent configuration once in `.agentscfg/`, then generate equivalent
config for Claude Code, OpenCode, and Codex CLI.

## Install

```bash
npm install -g agentscfg
# or
npx agentscfg <command>
```

## Quick Start

```bash
agentscfg init
# edit .agentscfg/instructions/* and .agentscfg/skills/*
agentscfg gen --dry-run
agentscfg diff
agentscfg gen
agentscfg import --from codex
```

## Commands

```text
init [--force]
validate
diff [--to ...]
gen [--to ...] [--remove] [--adopt] [--force] [--allow-dirty] [--dry-run]
import --from <tool>
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
- OpenCode: `.opencode/skill/<skill>/...` (agent/config files come from `.agentscfg/targets/opencode/**`)
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
- By default, gen will not overwrite unmanaged files unless you pass `--adopt`
  or the file already contains the marker.
- If a generated file's hash marker does not match, gen refuses to overwrite
  unless `--force` is provided.
- `--remove` is disabled unless `managed.allowRemove` is set to true.
- Managed tracking is stored in `.agentscfg/.managed.json`. If it's missing, run
  `agentscfg gen --adopt` to create it.
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
npm install
npm test
npm run build
npm run tsc
```
