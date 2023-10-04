#!/usr/bin/env bash

VERSION=$(git describe --tags --abbrev=0 --candidates 100 --always)
HEAD=$(git rev-parse HEAD)

if [[ "$VERSION" = "$HEAD" ]]; then
  VERSION="v0.0.0"
fi;

set -euo pipefail

echo "${VERSION:1}"
