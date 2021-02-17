#!/usr/bin/env bash
set -eu

export CYGWIN='winsymlinks:native'
export OPAM_LINT='false'

OPAM_REPOSITORY="$1"
OPAM_DL_SUB_LINK=0.0.0.2
OPAM_URL="https://github.com/fdopen/opam-repository-mingw/releases/download/${OPAM_DL_SUB_LINK}/opam64.tar.xz"
OPAM_ARCH=opam64

GITHUB_WORKSPACE=$(cygpath "${GITHUB_WORKSPACE}")
COMPILER_CACHE="${GITHUB_WORKSPACE}/.github/caches/compiler/cache.tar"
BUILD_CACHE="${GITHUB_WORKSPACE}/.github/caches/build/cache.tar"

if ((INITIALISING)); then
  echo Preparing Cygwin environment
  curl -fsSL -o "${OPAM_ARCH}.tar.xz" "${OPAM_URL}"
  tar -xf "${OPAM_ARCH}.tar.xz"
  "${OPAM_ARCH}/install.sh" --quiet --prefix=/usr
  rm -rf "${OPAM_ARCH}" "${OPAM_ARCH}.tar.xz"
fi

opam init --bare --disable-sandboxing --enable-completion --enable-shell-hook --auto-setup --yes default "${OPAM_REPOSITORY}"

if ((INITIALISING)); then
  opam clean --logs --download-cache --yes
  rm -rf ~/.opam/repo/default/.git
  find ~/.opam/repo/default/packages -name opam -delete
  # TODO Exclude /bin/tar and the dependent DLLs!
  tar -pcf "$(cygpath "${OPAM_CACHE}")" -C "${CYGWIN_NATIVE_ROOT}" .
fi

if [[ -e ${COMPILER_CACHE} ]]; then
  tar -pxf "${COMPILER_CACHE}" -C ~/.opam
  if [[ -e ${BUILD_CACHE} ]]; then
    tar -pxf "${BUILD_CACHE}" -C ~/.opam
  else
    cp -a ~/.opam ~/.opam-bare
  fi
else
  if [[ -e ${BUILD_CACHE} ]]; then
    echo "Compiler cache missing - ignoring ${BUIKLD_CACHE}"
    rm "${BUILD_CACHE}"
  fi
  cp -a ~/.opam ~/.opam-bare
fi
