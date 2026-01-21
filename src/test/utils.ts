import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const makeTempDir = async () =>
  fs.mkdtemp(path.join(os.tmpdir(), "agentscfg-"));

export const cleanupDir = async (dir: string) =>
  fs.rm(dir, { recursive: true, force: true });

export const writeTextFile = async (filePath: string, content: string) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
};

export const writeJsonFile = async (filePath: string, data: unknown) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
};

export const fileExists = async (filePath: string) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};
