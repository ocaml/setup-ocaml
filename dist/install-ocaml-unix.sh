#!/bin/sh

set -ex

opam switch set build 2>/dev/null || opam switch create build "$1"
