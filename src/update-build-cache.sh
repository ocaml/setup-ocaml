#!/usr/bin/env bash

set -eu

if [[ $(uname -o) = 'Cygwin' ]]; then
  GITHUB_WORKSPACE=$(cygpath "${GITHUB_WORKSPACE}")
  WINDOWS=1
else
  WINDOWS=0
fi

if [[ ! -e ${GITHUB_WORKSPACE}/.github/caches/$1/cache.tar ]]; then
  opam clean --logs --download-cache --all-switches --yes
  # XXX Upstream should no longer install these by default
  rm -f ~/.opam/build/bin/ocaml*.byte
  if ((WINDOWS)); then
    export CYGWIN=winsymlinks:nativestrict
    pushd ~/.opam/build/bin > /dev/null
    # XXX Submit upstream
    if [[ -e ~/.opam/build/bin/ocamlbuild.native.exe ]]; then
      ln -sf ocamlbuild.exe ocamlbuild.native.exe
    fi
    # XXX Submit upstream
    #     ocamlc.exe -> ocamlc.opt.exe rather than the other way around owing to PR#9793
    for f in ocaml*.opt.exe; do
      ln -sf ${f%%.opt.exe}.exe $f
    done
    popd > /dev/null
  fi
  mkdir -p "${GITHUB_WORKSPACE}/.github/caches/$1"
  cd ~/.opam
  rm -f ../cache-manifest.txt
  while IFS= read -r entry; do
    entry=${entry#./}
    [[ ${entry} = '.' ]] && continue
    if [[ ! -e ~/.opam-bare/${entry} || ~/.opam/${entry} -nt ~/.opam-bare/${entry} ]]; then
      echo "./${entry}" >> ../cache-manifest.txt
    fi
  done < <(find . -type f -o -type l)
  while IFS= read -r entry; do
    entry=${entry#./}
    [[ ${entry} = '.' ]] && continue
    if [[ ! -d ~/.opam-bare/${entry} ]]; then
      echo "./${entry}" >> ../cache-manifest.txt
    fi
  done < <(find . -type d -empty)
  cd ..
  tar -pcf "${GITHUB_WORKSPACE}/.github/caches/$1/cache.tar" -C ~/.opam --files-from ~/cache-manifest.txt
  rm -f ~/cache-manifest.txt
  rm -rf ~/.opam-bare
  if [[ $1 = 'compiler' ]]; then
    cp -a ~/.opam ~/.opam-bare
  fi
fi
