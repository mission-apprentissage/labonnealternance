#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

/opt/app/tools/docker-compose.sh run --rm --no-deps server yarn cli "$@"
