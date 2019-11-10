#!/usr/bin/env bash
export OPAMYES=1
export OPAMJOBS=3
set -ex
echo Preparing Cygwin environment
if [ "$1" = "" ]; then
  OCAML_VERSION="4.07.1"
else
  OCAML_VERSION="$1"
fi
SWITCH="${OCAML_VERSION}+mingw64c"
OPAM_DL_SUB_LINK=0.0.0.2
OPAM_URL="https://github.com/fdopen/opam-repository-mingw/releases/download/${OPAM_DL_SUB_LINK}/opam64.tar.xz"
OPAM_ARCH=opam64
export OPAM_LINT="false"
export CYGWIN='winsymlinks:native'
export OPAMYES=1
set -eu
curl -fsSL -o "${OPAM_ARCH}.tar.xz" "${OPAM_URL}"
tar -xf "${OPAM_ARCH}.tar.xz"
"${OPAM_ARCH}/install.sh" --quiet --prefix=/usr
# if a msvc compiler must be compiled from source, we have to modify the
# environment first
case "$SWITCH" in
  *msvc32)
      eval $(ocaml-env cygwin --ms=vs2015 --no-opam --32) ;;
  *msvc64)
      eval $(ocaml-env cygwin --ms=vs2015 --no-opam --64) ;;
esac
opam init -c "ocaml-variants.${SWITCH}" --disable-sandboxing --enable-completion --enable-shell-hook --auto-setup default "https://github.com/fdopen/opam-repository-mingw.git#opam2"
opam config set jobs "$OPAMJOBS"
opam update
is_msvc=0
case "$SWITCH" in
    *msvc*)
        is_msvc=1
        eval $(ocaml-env cygwin --ms=vs2015)
        ;;
    *mingw*)
        eval $(ocaml-env cygwin)
        ;;
    *)
        echo "ocamlc reports a dubious system: ${ocaml_system}. Good luck!" >&2
        eval $(opam env)
esac
if [ $is_msvc -eq 0 ]; then
    opam install depext-cygwinports depext
else
    opam install depext
fi
