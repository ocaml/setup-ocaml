import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { setInputs } from "../test/runner.js";
import { readInputs } from "./inputs.js";

beforeEach(() => setInputs());
afterEach(() => vi.unstubAllEnvs());

it("parses the default inputs", () => {
  expect(readInputs()).toMatchInlineSnapshot(`
    {
      "allowPrereleaseOpam": false,
      "cache": true,
      "cachePrefix": "v3",
      "duneCache": false,
      "githubToken": "token",
      "ocamlCompiler": "5.5",
      "opamDisableSandboxing": false,
      "opamLocalPackages": "*.opam",
      "opamPin": true,
      "opamRepositoriesLowestPriorityFirst": [
        [
          "default",
          "https://opam.ocaml.org",
        ],
      ],
      "windowsCompiler": "mingw",
      "windowsEnvironment": "cygwin",
    }
  `);
});

it("orders repositories from lowest to highest priority", () => {
  setInputs({
    "opam-repositories": "overlay: https://example.com/overlay\ndefault: https://opam.ocaml.org",
  });
  expect(readInputs().opamRepositoriesLowestPriorityFirst).toMatchInlineSnapshot(`
    [
      [
        "default",
        "https://opam.ocaml.org",
      ],
      [
        "overlay",
        "https://example.com/overlay",
      ],
    ]
  `);
});

it("ignores dune-cache when cache is disabled", () => {
  setInputs({ cache: "false", "dune-cache": "true" });
  const { cache, duneCache } = readInputs();
  expect({ cache, duneCache }).toMatchInlineSnapshot(`
    {
      "cache": false,
      "duneCache": false,
    }
  `);
});

it("reports invalid inputs", () => {
  const output = [
    { "windows-environment": "wsl" },
    { "windows-compiler": "clang" },
    { "opam-repositories": "- https://opam.ocaml.org" },
    { "opam-repositories": "{}" },
    { "opam-pin": "maybe" },
  ]
    .map((overrides) => {
      setInputs(overrides);
      const [[name, value] = []] = Object.entries(overrides);
      try {
        readInputs();
        return `${name}: ${value}\n  accepted`;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `${name}: ${value}\n  ${message.replaceAll("\n", "\n  ")}`;
      }
    })
    .join("\n");
  expect(output).toMatchInlineSnapshot(`
    windows-environment: wsl
      Invalid windows-environment value 'wsl'. Supported values: cygwin, msys2
    windows-compiler: clang
      Invalid windows-compiler value 'clang'. Supported values: mingw, msvc
    opam-repositories: - https://opam.ocaml.org
      opam-repositories input must be a YAML mapping of name: URL pairs
    opam-repositories: {}
      opam-repositories input must not be empty
    opam-pin: maybe
      Input does not meet YAML 1.2 "Core Schema" specification: opam-pin
      Support boolean input list: \`true | True | TRUE | false | False | FALSE\`
  `);
});
