#!/usr/bin/env bash

set -euo pipefail

function Release() {
  local MAJOR_VERSION="${1:-}"
  local FULL_VERSION="${2:-}"

  if [ -z "$MAJOR_VERSION" ] || [ -z "$FULL_VERSION" ]; then
    echo "Usage: release.sh [MAJOR_VERSION] [FULL_VERSION]"
    echo "Example: release.sh v1 v1.0.0"
    exit 1
  fi

  echo "Create a full version tag: $FULL_VERSION"
  if [ "$(git rev-parse --quiet --verify "refs/tags/$FULL_VERSION^{commit}" || true)" != "$(git rev-parse HEAD)" ]; then
    git tag "$FULL_VERSION"
  fi

  echo "Move the major version tag: $MAJOR_VERSION"
  git tag --force "$MAJOR_VERSION"

  echo "Push tags"
  git push --atomic origin "refs/tags/$FULL_VERSION" "+refs/tags/$MAJOR_VERSION"

  echo "Create a GitHub release: $FULL_VERSION"
  gh release create "$FULL_VERSION" --generate-notes
}

Release "$@"
