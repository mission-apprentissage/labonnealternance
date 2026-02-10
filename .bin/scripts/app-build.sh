#!/usr/bin/env bash

set -euo pipefail

# Set script and root directories if not already set (for direct execution)
if [ -z "${SCRIPT_DIR:-}" ]; then
  export SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
if [ -z "${ROOT_DIR:-}" ]; then
  export ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
fi

export VERSION="${1:?"Veuillez préciser la version"}"
shift 1

mode=${2:?"Veuillez préciser le mode <push|load>"}
shift 1

export COMMIT_HASH="${1:?"Veuillez préciser le hash du commit"}"
shift 1

environement=${1:?"Veuillez spécifier l'environnement à build (production, recette, preview, local)"}
shift 1

get_channel() {
  local version="$1"
  channel=$(echo "$version" | cut -d '-' -f 2)

  if [ "$channel" == "$version" ]; then
    channel="latest"
  else
    channel=$(echo $channel | cut -d '.' -f 1 )
  fi

  echo $channel
}

set +e
docker buildx create --name mna-lba --driver docker-container --config "$SCRIPT_DIR/buildkitd.toml" 2> /dev/null
set -e

if [[ ! -z "${CI:-}" ]]; then
  export DEPS_ID=($(md5sum $ROOT_DIR/yarn.lock))
else
  export DEPS_ID=""
fi

export CHANNEL=$(get_channel $VERSION)

# "$@" is the list of environements
docker buildx bake --builder mna-lba --${mode} "$environement"
docker builder prune --builder mna-lba --keep-storage 20GB --force
docker buildx stop --builder mna-lba
