#!/bin/sh

set -ex

# opam has been initialised, but we need to switch to
# the right version from the system compiler

OCAML_VERSION="$1"
OCAML_VARIANT="$2" ## may be empty/missing/null => last parameter
OCAML_VV="$OCAML_VERSION"
if [ "$OCAML_VARIANT" != "" ]; then OCAML_VV="$OCAML_VERSION+$OCAML_VARIANT" ; fi

CURRENT_OCAML=$(opam list ocaml-variants --installed --columns version --short --color=never)
if [ -z "$CURRENT_OCAML" ]; then CURRENT_OCAML=$(opam info ocaml --field=version --color=never) ; fi

if [ "$CURRENT_OCAML" != "$OCAML_VV" ]; then
  opam switch set "$OCAML_VV" || opam switch create "$OCAML_VV" "$OCAML_VV"
fi
