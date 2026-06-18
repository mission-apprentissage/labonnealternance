#!/usr/bin/env bash

set -euo pipefail

SUBMODULE_PATH="${ROOT_DIR}/.bin/shared"

if [[ ! -f "$SUBMODULE_PATH/.git" ]] && [[ ! -d "$SUBMODULE_PATH/.git" ]]; then

  echo "Initialisation du sous-module : $SUBMODULE_PATH"
  git submodule update --init -- "$SUBMODULE_PATH"

else

  expected=$(git ls-files --stage -- "$SUBMODULE_PATH" | awk '{print $2}')
  current=$(git -C "$SUBMODULE_PATH" rev-parse HEAD)

  if [[ "$expected" != "$current" ]]; then

    echo "Mise à jour du sous-module :"
    echo "$current → $expected"
    git submodule update -- "$SUBMODULE_PATH"

  fi

fi

. "${ROOT_DIR}/.bin/shared/commands.sh"

################################################################################
# Shared commands
################################################################################

_register "app:deploy"
_register "app:deploy:log:encrypt"
_register "app:deploy:log:decrypt"
_register "dev:dependencies:check"
_register "dev:setup"
_register "docker:login"
_register "seed:apply"
_register "seed:update"
_register "vault:edit"

################################################################################
# Local commands
################################################################################

_local_app_build__help="Build Ui & Server Docker images"
_register "app:build" "_local_app_build"

function _local_app_build() {
  "${SCRIPTS_DIR}/app-build.sh" "$@"
}

_local_env_init__help="Update local env files using values from SOPS files"
_register "env:init" "_local_env_init"

function _local_env_init() {
  "${SCRIPTS_DIR}/env-init.sh" "$@"
}

_local_app_release__help="Build & push Docker image releases"
_register "app:release" "_local_app_release"

function _local_app_release() {
  "${SCRIPTS_DIR}/app-release.sh" "$@"
}

_local_app_release_interactive__help="Interactivelly build & push Docker image releases"
_register "app:release:interactive" "_local_app_release_interactive"

function _local_app_release_interactive() {
  "${SCRIPTS_DIR}/app-release-interactive.sh" "$@"
}

_local_sentry_deploy__help="Notify deployment to Sentry for existing release"
_register "sentry:deploy" "_local_sentry_deploy"

function _local_sentry_deploy() {
  "${SCRIPTS_DIR}/sentry-deploy.sh" "$@"
}

_local_sentry_release__help="Create Sentry release for existing Docker image"
_register "sentry:release" "_local_sentry_release"

function _local_sentry_release() {
  "${SCRIPTS_DIR}/sentry-release.sh" "$@"
}

_local_preview_cleanup__help="Remove preview from close pull-requests"
_register "preview:cleanup" "_local_preview_cleanup"

function _local_preview_cleanup() {
  "${SCRIPTS_SHARED_DIR}/run-playbook.sh" "preview_cleanup.yml" "preview"
}

