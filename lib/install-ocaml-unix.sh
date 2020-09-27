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

OS_ID=$(eval echo $(cat /etc/os-release | grep -Po "(?<=^ID=)(.*)$"))
OS_VERSION=$(eval echo $(cat /etc/os-release | grep -Po "(?<=^VERSION_ID=)(.*)$"))

# add gcc/g++ multilib for '32bit' variants
case "$OCAML_VARIANT" in *32bit*) /usr/bin/sudo apt-get -y install gcc-multilib g++-multilib ;; esac

# fix musl-tools bug in ubuntu 18.04; ref: <https://github.com/ocaml/ocaml/issues/9131#issuecomment-599765888>
if [ "$OS_ID $OS_VERSION" = "ubuntu 18.04" ]; then
    /usr/bin/sudo add-apt-repository -y ppa:avsm/musl
    /usr/bin/sudo apt-get -y install musl-tools
fi

if [ "$CURRENT_OCAML" != "$OCAML_VV" ]; then
    opam switch set "$OCAML_VV" 2>/dev/null || opam switch create "$OCAML_VV" "$OCAML_VV"
fi
