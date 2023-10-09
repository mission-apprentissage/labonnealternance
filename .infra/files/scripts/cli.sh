#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

docker compose run --rm --no-deps server yarn cli "$@"
