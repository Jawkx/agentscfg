import { describe, expect, test } from "bun:test";
import { extractMarkerSha } from "./marker";

describe("extractMarkerSha", () => {
  test("extracts sha256 from valid marker", () => {
    const content = `# Some content
<!-- agentscfg:generated file=CLAUDE.md source=BASE.md sha256=ca606387a9baf8b290494887f245909f05d8ace274e5ba7e2e656a19b5a7858b -->`;
    expect(extractMarkerSha(content)).toBe(
      "ca606387a9baf8b290494887f245909f05d8ace274e5ba7e2e656a19b5a7858b"
    );
  });

  test("extracts sha256 from marker with multiple sources", () => {
    const content = `<!-- agentscfg:generated file=CLAUDE.md source=BASE.md,PROJECT.md sha256=abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234 -->`;
    expect(extractMarkerSha(content)).toBe(
      "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234"
    );
  });

  test("returns null for content without marker", () => {
    const content = `# Just markdown
No marker here`;
    expect(extractMarkerSha(content)).toBeNull();
  });

  test("returns null for malformed marker (short sha)", () => {
    const content = `<!-- agentscfg:generated sha256=tooshort -->`;
    expect(extractMarkerSha(content)).toBeNull();
  });

  test("is case insensitive", () => {
    const content = `<!-- AGENTSCFG:GENERATED SHA256=ca606387a9baf8b290494887f245909f05d8ace274e5ba7e2e656a19b5a7858b -->`;
    expect(extractMarkerSha(content)).toBe(
      "ca606387a9baf8b290494887f245909f05d8ace274e5ba7e2e656a19b5a7858b"
    );
  });
});
