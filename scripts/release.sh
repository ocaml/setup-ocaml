#!/usr/bin/env bash

function Release() {
  local MAJOR_VERSION="$1"
  local FULL_VERSION="$2"

  if [ -z "$MAJOR_VERSION" ] || [ -z "$FULL_VERSION" ]; then
    echo "Usage: release.sh [MAJOR_VERSION] [FULL_VERSION]"
    echo "Example: release.sh v1 v1.0.0"
    exit 1
  fi

  echo "Delete a major version tag: $MAJOR_VERSION"
  git tag -d "$MAJOR_VERSION"
  git push origin ":$MAJOR_VERSION"

  echo "Create a major version tag: $MAJOR_VERSION"
  git tag "$MAJOR_VERSION"

  echo "Create a full version tag: $FULL_VERSION"
  git tag "$FULL_VERSION"

  echo "Push tags"
  git push --tags
}

Release "$1" "$2"
