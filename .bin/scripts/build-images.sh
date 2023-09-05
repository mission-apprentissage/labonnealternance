#!/bin/bash
set -euo pipefail

export VERSION="${1:?"Veuillez préciser la version"}"
mode=${2:?"Veuillez préciser le mode <push|load>"}
shift 2

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

if [[ $# == "0" ]]; then
  echo "Veuillez spécifier les environnements à build (production, recette, preview, local)"
  exit 1;
fi;

set +e
docker buildx create --name mna --driver docker-container --bootstrap --use 2> /dev/null
set -e

if [[ ! -z "${CI:-}" ]]; then
  export DEPS_ID=($(md5sum $ROOT_DIR/yarn.lock))
else
  export DEPS_ID=""
fi

export CHANNEL=$(get_channel $VERSION)

# "$@" is the list of environements
docker buildx bake --builder mna --${mode} "$@"
