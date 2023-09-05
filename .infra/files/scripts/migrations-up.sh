#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly LOG_DIR="/var/log/data-jobs"
readonly LOG_FILEPATH="${LOG_DIR}/run-migrations_$(date +'%Y-%m-%d_%H%M%S').log"

if [ ! -d "$LOG_DIR" ]; then
    sudo mkdir -p "$LOG_DIR"
    sudo chown $(whoami):$(whoami) "$LOG_DIR"
fi

run_migrations(){
    echo "Application des migrations ..."
    docker compose run --rm --no-deps server yarn cli migrations:up 2>&1 | tee "$LOG_FILEPATH"
} 

run_migrations
