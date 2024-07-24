#!/usr/bin/env bash

set -euo pipefail

function Help() {
   # Display Help
   echo "Commands"
   echo "  bin:setup                                  Installs mna-lba binary with zsh completion on system"
   echo "  init:env                                   Update local env files using values from vault file"
   echo "  release:interactive                        Build & Push Docker image releases"
   echo "  release:app                                Build & Push Docker image releases"
   echo "  deploy <env> --user <your_username>        Deploy application to <env>"
   echo "  preview:build                              Build preview"
   echo "  preview:cleanup --user <your_username>     Remove preview from close pull-requests"
   echo "  vault:edit                                 Edit vault file"
   echo "  vault:password                             Show vault password"
   echo "  seed:update                                Update seed using a database"
   echo "  seed:apply                                 Apply seed to a database"
   echo "  deploy:log:encrypt                         Encrypt Github ansible logs"
   echo "  deploy:log:dencrypt                        Decrypt Github ansible logs"
   echo "  log:encrypt <log_file>                     Encrypt log file"
   echo "  log:decrypt <encrypted_log_file>           Decrypt log file"
   echo "  e2e:run                                    Run end to end tests"
   echo
   echo
}

function bin:setup() {
  sudo ln -fs "${ROOT_DIR}/.bin/mna-lba" /usr/local/bin/mna-lba

  sudo mkdir -p /usr/local/share/zsh/site-functions
  sudo ln -fs "${ROOT_DIR}/.bin/zsh-completion" /usr/local/share/zsh/site-functions/_mna-lba
  sudo rm -f ~/.zcompdump*
}

function init:env() {
  "${SCRIPT_DIR}/setup-local-env.sh" "$@"
}

function release:interactive() {
  "${SCRIPT_DIR}/release-interactive.sh" "$@"
}

function release:app() {
  "${SCRIPT_DIR}/release-app.sh" "$@"
}

function deploy() {
  "${SCRIPT_DIR}/deploy-app.sh" "$@"
}

function build:image() {
  "${SCRIPT_DIR}/build-images.sh" "$@"
}

function preview:build() {
  "${SCRIPT_DIR}/build-images.sh" "$@"
}

function preview:cleanup() {
  "${SCRIPT_DIR}/run-playbook.sh" "preview_cleanup.yml" "preview"
}

function vault:edit() {
  editor=${EDITOR:-'code -w'}
  EDITOR=$editor "${SCRIPT_DIR}/edit-vault.sh" "$@"
}

function vault:password() {
  "${SCRIPT_DIR}/get-vault-password-client.sh" "$@"
}

function seed:update() {
  "${SCRIPT_DIR}/seed-update.sh" "$@"
}

function seed:apply() {
  "${SCRIPT_DIR}/seed-apply.sh" "$@"
}

function deploy:log:encrypt() {
  (cd "$ROOT_DIR" && "${SCRIPT_DIR}/deploy-log-encrypt.sh" "$@")
}

function deploy:log:decrypt() {
  (cd "$ROOT_DIR" && "${SCRIPT_DIR}/deploy-log-decrypt.sh" "$@")
}

function e2e:run() {
  "${SCRIPT_DIR}/run-tests-e2e.sh" "$@"
}

function log:encrypt() {
  "${SCRIPT_DIR}/log-encrypt.sh" "$@"
}

function log:decrypt() {
  "${SCRIPT_DIR}/log-decrypt.sh" "$@"
}
