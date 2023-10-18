#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

sync_indexes(){
    echo "Creation des indexes MongoDB & ElasticSearch"
    docker compose run --rm --no-deps server yarn cli mongodb:indexes:create --queued
    docker compose run --rm --no-deps server yarn cli index --queued
}

sync_indexes
