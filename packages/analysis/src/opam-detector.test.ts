import { expect, it } from "vite-plus/test";
import { createBuildTarget, OpamOutput } from "./opam-detector.js";

it("lists the dependencies of an opam package by package URL", () => {
  const output = OpamOutput.parse({
    tree: [
      {
        name: "example",
        version: "dev",
        dependencies: [
          { name: "conf-g++", version: "1.0", dependencies: [] },
          {
            name: "ocaml",
            version: "5.5.0",
            dependencies: [{ name: "ocaml-base-compiler", version: "5.5.0", dependencies: [] }],
          },
        ],
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
    direct    pkg:opam/conf-g%252B%252B@1.0
    direct    pkg:opam/ocaml@5.5.0
    indirect  pkg:opam/ocaml-base-compiler@5.5.0
  `);
});
