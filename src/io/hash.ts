import { Effect } from "effect";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { IoError } from "../core/model/errors";

export const sha256String = (input: string) =>
  Effect.try({
    try: () => createHash("sha256").update(input).digest("hex"),
    catch: (err) => new IoError("Failed to hash string", String(err))
  });

export const sha256File = (filePath: string) =>
  Effect.tryPromise({
    try: async () => {
      const data = await fs.readFile(filePath);
      return createHash("sha256").update(data).digest("hex");
    },
    catch: (err) => new IoError(`Failed to hash ${filePath}`, String(err))
  });
