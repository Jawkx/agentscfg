// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m"
};

// Check if colors should be used (respect NO_COLOR env var and TTY)
const useColors = () => !process.env.NO_COLOR && process.stdout.isTTY;

// Color formatting functions
export const green = (s: string) =>
  useColors() ? `${colors.green}${s}${colors.reset}` : s;
export const yellow = (s: string) =>
  useColors() ? `${colors.yellow}${s}${colors.reset}` : s;
export const red = (s: string) =>
  useColors() ? `${colors.red}${s}${colors.reset}` : s;
export const cyan = (s: string) =>
  useColors() ? `${colors.cyan}${s}${colors.reset}` : s;
export const dim = (s: string) =>
  useColors() ? `${colors.dim}${s}${colors.reset}` : s;
export const bold = (s: string) =>
  useColors() ? `${colors.bold}${s}${colors.reset}` : s;

export const info = (message: string) => {
  console.log(message);
};

export const warn = (message: string) => {
  console.warn(message);
};

export const error = (message: string) => {
  console.error(message);
};
