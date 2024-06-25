#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

sync_indexes(){
    echo "Creation des indexes MongoDB"
    /opt/app/tools/docker-compose.sh run --rm --no-deps server yarn cli recreate:indexes --queued
}

sync_indexes
