#!/usr/bin/env bash

set -euo pipefail

if [ -z "${SCRIPTS_DIR:-}" ]; then
  export SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

if [ -z "${ROOT_DIR:-}" ]; then
  export ROOT_DIR="$(cd "${SCRIPTS_DIR}/../.." && pwd)"
fi

defaultMode=""
if [ ! -z "${CI:-}" ]; then
  defaultMode="push"
else
  defaultMode="load"
fi

readonly next_version="${1}"
readonly COMMIT_HASH="${2}"
readonly mode=${3:-$defaultMode}

"$ROOT_DIR"/.bin/mna app:build $next_version $mode $COMMIT_HASH production
