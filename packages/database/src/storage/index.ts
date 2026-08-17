import type { IStorageAdapter } from "../types.js";
import { MemoryStorageAdapter } from "./memory.js";
import { FileStorageAdapter } from "./file.js";

export * from "./memory.js";
export * from "./file.js";

export function createStorageAdapter(
  type: string = "file",
  filePath?: string
): IStorageAdapter {
  switch (type.toLowerCase()) {
    case "memory":
      return new MemoryStorageAdapter();
    case "file":
    default:
      return new FileStorageAdapter(filePath);
  }
}
