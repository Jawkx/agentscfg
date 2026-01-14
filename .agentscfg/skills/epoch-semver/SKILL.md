---
name: epoch-semver
description: Use when modifying, proposing, or explaining version numbers, release tags, or upgrade policies in this repo; applies the repo’s epoch semver scheme (see EPOCH_SEMVER.md) and ensures any version changes follow that format.
---

# Epoch SemVer Skill

## Quick use

- Read `EPOCH_SEMVER.md` at the repo root for the authoritative rules.
- Determine the desired bump type (patch/minor/major/epoch) based on the change.
- Apply the epoch semver formula and update all versioned files consistently.

## Formula

```
version = (epoch * 1000 + major).minor.patch
```

Where `major` is 0–999 within an epoch.

## Workflow

1. Locate version sources (e.g., `package.json`, release tags, changelog). If none exist, ask the user where versions should live.
2. Determine bump type:
   - patch: bugfixes/refactors/docs
   - minor: backwards-compatible features
   - major: breaking changes within epoch
   - epoch: rare era reset; confirm explicitly with the user
3. Compute the next version using the formula above.
4. Update all relevant files and release notes in one pass.
5. If epoch changes, ensure `EPOCH_SEMVER.md` is updated accordingly.

## Decode/encode helpers

- Given `epoch` and `major`: `first = epoch * 1000 + major`.
- Given the first number `X`: `epoch = floor(X / 1000)`, `major = X % 1000`.

## Notes

- Keep changes SemVer-compatible; do not add leading zeros.
- Ask for confirmation before epoch bumps.
