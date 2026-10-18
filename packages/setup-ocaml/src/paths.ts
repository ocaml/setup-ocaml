import * as path from "node:path";

export const toMsysPath = (windowsPath: string) => {
  const { root } = path.win32.parse(windowsPath);
  return `/${root.charAt(0).toLowerCase()}/${windowsPath.slice(root.length).replaceAll("\\", "/")}`;
};

export const toCygwinPath = (windowsPath: string) => {
  return path.posix.join("/cygdrive", toMsysPath(windowsPath));
};
