#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly LOG_DIR="/var/log/data-jobs"

if [ ! -d "$LOG_DIR" ]; then
    sudo mkdir -p "$LOG_DIR"
    sudo chown $(whoami):$(whoami) "$LOG_DIR"
fi

trigger_indexes_creation(){
    echo "Création des index mongoDb ..."
    /opt/app/tools/docker-compose.sh run --rm --no-deps server yarn cli indexes:recreate --queued
} 

trigger_indexes_creation
