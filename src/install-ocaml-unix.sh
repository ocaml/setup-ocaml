#!/bin/sh

set -ex

opam switch set "$1" 2>/dev/null || opam switch create "$1" "$1"
