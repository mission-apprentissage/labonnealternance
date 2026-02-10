#!/usr/bin/env bash

set -euo pipefail

defaultMode=""
if [ ! -z "${CI:-}" ]; then
  defaultMode="push"
else
  defaultMode="load"
fi

readonly next_version="${1}"
readonly COMMIT_HASH="${2}"
readonly mode=${3:-$defaultMode}

"$ROOT_DIR/.bin/scripts/app-build.sh" $next_version $mode $COMMIT_HASH production
