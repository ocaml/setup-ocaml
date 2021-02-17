#!/usr/bin/env bash

set -eu

CACHE_ROOT="${GITHUB_WORKSPACE}/.github/caches"
OPAM_CACHE="${CACHE_ROOT}/opam/cache.tar"
COMPILER_CACHE="${CACHE_ROOT}/compiler/cache.tar"
BUILD_CACHE="${CACHE_ROOT}/build/cache.tar"

if [[ -e ${OPAM_CACHE} ]]; then
  INITIALISING=0
  tar -pxf "${OPAM_CACHE}" -C ~
else
  INITIALISING=1
fi

opam init --bare --yes --auto-setup default "$1"

if ((INITIALISING)); then
  opam clean --logs --download-cache --yes
  rm -rf ~/.opam/repo/default/.git
  find ~/.opam/repo/default/packages -name opam -delete
  mkdir -p "${CACHE_ROOT}/opam"
  tar -pcf "${OPAM_CACHE}" -C ~ .opam
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
