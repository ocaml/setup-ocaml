#!/bin/sh

set -ex

# opam has been initialised, but we need to switch to
# the right version from the system compiler

CURRENT_OCAML=$(opam info -f version ocaml --color=never)
SWITCHES=$(opam switch list)

if [ "$CURRENT_OCAML" != "$1" ] && [ "$SWITCHES" != *"$1"* ]; then
  opam switch create "$1" "$1"
fi
