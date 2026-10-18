import { describe, expect, it } from "vite-plus/test";

import { toCygwinPath, toMsysPath } from "./paths.js";

describe("Windows path conversion", () => {
  it("converts Windows paths for MSYS2 and Cygwin", () => {
    const windowsPaths = [
      String.raw`D:\a\setup-ocaml\setup-ocaml\_opam`,
      String.raw`C:\Users\runneradmin\AppData\Local\Temp\gpg`,
    ];
    const output = windowsPaths
      .map((windowsPath) =>
        [
          windowsPath,
          `  msys2:  ${toMsysPath(windowsPath)}`,
          `  cygwin: ${toCygwinPath(windowsPath)}`,
        ].join("\n")
      )
      .join("\n");
    expect(output).toMatchInlineSnapshot(`
    D:\\a\\setup-ocaml\\setup-ocaml\\_opam
      msys2:  /d/a/setup-ocaml/setup-ocaml/_opam
      cygwin: /cygdrive/d/a/setup-ocaml/setup-ocaml/_opam
    C:\\Users\\runneradmin\\AppData\\Local\\Temp\\gpg
      msys2:  /c/Users/runneradmin/AppData/Local/Temp/gpg
      cygwin: /cygdrive/c/Users/runneradmin/AppData/Local/Temp/gpg
  `);
  });
});
