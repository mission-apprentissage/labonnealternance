#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

sync_indexes(){
    echo "Creation des indexes MongoDB"
    docker compose run --rm --no-deps server yarn cli recreate:indexes --queued
}

sync_indexes
