#!/usr/bin/env bash

set -e

COMPILER="$1"

if [[ $(opam config var os) = 'win32' ]]; then
  COMPILER="ocaml-variants.${COMPILER}+mingw64c"
fi

opam switch set build 2>/dev/null || opam switch create build "${COMPILER}"
opam config set jobs "$OPAMJOBS"
