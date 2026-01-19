import { describe, expect, test } from "bun:test";
import { isExcludedPath, shouldIncludePath } from "./filters";

describe("isExcludedPath", () => {
  test("excludes .DS_Store", () => {
    expect(isExcludedPath(".DS_Store")).toBe(true);
  });

  test("excludes Thumbs.db", () => {
    expect(isExcludedPath("Thumbs.db")).toBe(true);
  });

  test("excludes .git", () => {
    expect(isExcludedPath(".git")).toBe(true);
  });

  test("excludes node_modules", () => {
    expect(isExcludedPath("node_modules")).toBe(true);
  });

  test("excludes .tmp files", () => {
    expect(isExcludedPath("file.tmp")).toBe(true);
    expect(isExcludedPath(".tmp")).toBe(true);
  });

  test("allows normal directories", () => {
    expect(isExcludedPath("src")).toBe(false);
    expect(isExcludedPath("my-skill")).toBe(false);
  });
});

describe("shouldIncludePath", () => {
  test("excludes paths containing .git", () => {
    expect(shouldIncludePath(".git/config")).toBe(false);
    expect(shouldIncludePath("foo/.git/HEAD")).toBe(false);
  });

  test("excludes paths containing node_modules", () => {
    expect(shouldIncludePath("node_modules/foo/bar")).toBe(false);
    expect(shouldIncludePath("skills/node_modules/x")).toBe(false);
  });

  test("excludes .tmp files anywhere in path", () => {
    expect(shouldIncludePath("foo/bar.tmp")).toBe(false);
    expect(shouldIncludePath("foo/.tmp/bar")).toBe(false);
  });

  test("includes normal paths", () => {
    expect(shouldIncludePath("src/index.ts")).toBe(true);
    expect(shouldIncludePath("skills/my-skill/SKILL.md")).toBe(true);
  });

  test("handles Windows-style separators", () => {
    expect(shouldIncludePath("foo\\node_modules\\bar")).toBe(false);
    expect(shouldIncludePath("src\\index.ts")).toBe(true);
  });
});
