#!/bin/sh

set -ex

# opam has been initialised, but we need to switch to
# the right version from the system compiler

CURRENT_OCAML=$(opam info -f version ocaml --color=never)

if [ "$CURRENT_OCAML" != "$1" ]; then
  opam switch set "$1" 2>/dev/null || opam switch create "$1" "$1"
else
  # opam has been initialized with --bare, the switch needs to be activated
  opam switch set "$1" 2>/dev/null
fi
