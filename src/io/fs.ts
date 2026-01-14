import { Effect } from "effect";
import fs from "node:fs/promises";
import path from "node:path";
import { IoError } from "../core/model/errors";

export const readFileString = (filePath: string) =>
  Effect.tryPromise({
    try: async () => await fs.readFile(filePath, "utf8"),
    catch: (err) => new IoError(`Failed to read ${filePath}`, String(err))
  });

export const writeFileAtomic = (filePath: string, content: string, mode?: number) =>
  Effect.tryPromise({
    try: async () => {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      const tempPath = path.join(
        dir,
        `.${path.basename(filePath)}.${Date.now()}.tmp`
      );
      await fs.writeFile(tempPath, content, "utf8");
      if (mode !== undefined) {
        await fs.chmod(tempPath, mode);
      }
      await fs.rename(tempPath, filePath);
    },
    catch: (err) => new IoError(`Failed to write ${filePath}`, String(err))
  });

export const mkdirp = (dirPath: string) =>
  Effect.tryPromise({
    try: async () => {
      await fs.mkdir(dirPath, { recursive: true });
    },
    catch: (err) => new IoError(`Failed to mkdir ${dirPath}`, String(err))
  });

export const readdir = (dirPath: string) =>
  Effect.tryPromise({
    try: async () => await fs.readdir(dirPath, { withFileTypes: true }),
    catch: (err) => new IoError(`Failed to read dir ${dirPath}`, String(err))
  });

export const stat = (filePath: string) =>
  Effect.tryPromise({
    try: async () => await fs.stat(filePath),
    catch: (err) => new IoError(`Failed to stat ${filePath}`, String(err))
  });

export const exists = (filePath: string) =>
  Effect.tryPromise({
    try: async () => {
      try {
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    },
    catch: (err) => new IoError(`Failed to access ${filePath}`, String(err))
  });

export const copyFile = (fromPath: string, toPath: string, mode?: number) =>
  Effect.tryPromise({
    try: async () => {
      await fs.mkdir(path.dirname(toPath), { recursive: true });
      await fs.copyFile(fromPath, toPath);
      if (mode !== undefined) {
        await fs.chmod(toPath, mode);
      }
    },
    catch: (err) =>
      new IoError(`Failed to copy ${fromPath} -> ${toPath}`, String(err))
  });

export const rm = (targetPath: string) =>
  Effect.tryPromise({
    try: async () => {
      await fs.rm(targetPath, { recursive: true, force: true });
    },
    catch: (err) => new IoError(`Failed to remove ${targetPath}`, String(err))
  });
