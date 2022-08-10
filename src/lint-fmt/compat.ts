import "core-js/actual/string/replace-all";

export function convertToUnix(str: string) {
  const regex = /\r?\n|\r/gi;
  const unix = str.replaceAll(regex, "\n");
  return unix;
}
