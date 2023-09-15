#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

run_migrations(){
    echo "Application des migrations ..."
    docker compose run --rm --no-deps server yarn cli index --queued
} 

run_migrations
