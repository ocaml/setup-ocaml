import { describe, expect, it } from "vite-plus/test";

import { createBuildTarget, OpamOutputSchema } from "./opam-detector.js";

describe(createBuildTarget, () => {
  it("lists the dependencies of an opam package by package URL", () => {
    const output = OpamOutputSchema.parse({
      tree: [
        {
          dependencies: [
            { dependencies: [], name: "conf-g++", version: "1.0" },
            {
              dependencies: [
                {
                  dependencies: [],
                  name: "ocaml-base-compiler",
                  version: "5.5.0",
                },
              ],
              name: "ocaml",
              version: "5.5.0",
            },
          ],
          name: "example",
          version: "dev",
        },
      ],
    });
    const buildTarget = createBuildTarget(output, "example.opam");
    const lines = [
      ...buildTarget
        .directDependencies()
        .map(({ packageURL }) => `direct    ${packageURL.toString()}`),
      ...buildTarget
        .indirectDependencies()
        .map(({ packageURL }) => `indirect  ${packageURL.toString()}`),
    ];
    expect(lines.join("\n")).toMatchInlineSnapshot(`
    direct    pkg:opam/conf-g%2B%2B@1.0
    direct    pkg:opam/ocaml@5.5.0
    indirect  pkg:opam/ocaml-base-compiler@5.5.0
  `);
  });
});
