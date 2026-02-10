#!/usr/bin/env bash

set -euo pipefail

if [ -f "${ROOT_DIR}/.bin/shared/commands.sh" ]; then

  . "${ROOT_DIR}/.bin/shared/commands.sh"

else

  echo "Mise à jour du sous-module mna-shared-bin"

  git submodule update --recursive --init --remote "${ROOT_DIR}/.bin/shared"

fi

################################################################################
# Non-shared commands
################################################################################

_meta_help["app:build"]="Build Ui & Server Docker images"

function app:build() {
  "${SCRIPT_DIR}/app-build.sh" "$@"
}

_meta_help["app:release"]="Build & push Docker image releases"

function app:release() {
  "${SCRIPT_DIR}/app-release.sh" "$@"
}

_meta_help["app:release:interactive"]="Interactivelly build & push Docker image releases"

function app:release:interactive() {
  "${SCRIPT_DIR}/app-release-interactive.sh" "$@"
}

_meta_help["env:init"]="Update local env files using values from SOPS files"

function env:init() {
  "${SCRIPT_DIR}/env-init.sh" "$@"
}

_meta_help["sentry:deploy"]="Notify deployment to sentry for existing sentry release"

function sentry:deploy() {
  "${SCRIPT_DIR}/sentry-deploy.sh" "$@"
}

_meta_help["sentry:release"]="Create sentry release for existing Docker image"

function sentry:release() {
  "${SCRIPT_DIR}/sentry-release.sh" "$@"
}

_meta_help["preview:cleanup"]="Remove preview from close pull-requests"

function preview:cleanup() {
  "${SCRIPT_DIR}/run-playbook.sh" "preview_cleanup.yml" "preview"
}


