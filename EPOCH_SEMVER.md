# Epoch SemVer

This repo uses **epoch semver**: we stay SemVer-compatible while reserving room for
rare “era” resets.

## Format

```
version = (epoch * 1000 + major).minor.patch
```

- `epoch` is an integer >= 0, bumped only for major eras.
- `major` is 0–999 within an epoch.
- `minor` and `patch` follow standard SemVer meaning.

## Bump rules

- **patch**: bug fixes, internal refactors, docs, small behavior fixes.
- **minor**: backwards-compatible features.
- **major**: breaking changes within the current epoch.
- **epoch**: rare, large-scale resets (architecture rewrite, new core goals, etc.).
  When incrementing epoch, reset major/minor/patch to 0.

## Examples

- epoch 0, major 2, minor 1, patch 0 -> `2.1.0`
- epoch 1, major 0, minor 0, patch 0 -> `1000.0.0`
- epoch 1, major 5, minor 2, patch 3 -> `1005.2.3`

## Guidance

- If an epoch bump is required, document the rationale in release notes.
- Keep the `major` value within 0–999 to avoid overlapping epochs.
- This file should be updated when the epoch changes.
