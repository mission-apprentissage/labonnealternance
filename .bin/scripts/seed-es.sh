#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

run_migrations(){
    echo "Application des migrations ..."
    yarn --cwd server build:dev && yarn --cwd server cli index --recreate
} 

run_migrations
