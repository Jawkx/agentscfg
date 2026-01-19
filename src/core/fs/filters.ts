const DEFAULT_EXCLUDES = [
  ".DS_Store",
  "Thumbs.db",
  ".git",
  "node_modules",
  ".tmp"
];

export const isExcludedPath = (name: string) => {
  if (DEFAULT_EXCLUDES.includes(name)) {
    return true;
  }
  return name.endsWith(".tmp");
};

export const shouldIncludePath = (relPath: string) => {
  const parts = relPath.split(/[\\/]/g);
  if (parts.some((part) => isExcludedPath(part))) {
    return false;
  }
  return !relPath.endsWith(".tmp");
};
