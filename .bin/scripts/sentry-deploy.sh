#!/bin/bash
set -euo pipefail

export ENVIRONMENT="${1:?"Veuillez préciser l'environement"}";
shift;
export VERSION="${1:?"Veuillez préciser la version"}";
shift;

if [[ -z "${ANSIBLE_VAULT_PASSWORD_FILE:-}" ]]; then
  ansible_extra_opts+=("--vault-password-file" "${SCRIPT_DIR}/get-vault-password-client.sh")
else
  echo "Récupération de la passphrase depuis l'environnement variable ANSIBLE_VAULT_PASSWORD_FILE" 
fi

readonly VAULT_FILE="${ROOT_DIR}/.infra/vault/vault.yml"

LBA_SERVER_SENTRY_DSN=$(ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq '.vault.LBA_SERVER_SENTRY_DSN')
LBA_UI_SENTRY_DSN=$(ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq '.vault.LBA_UI_SENTRY_DSN')
export SENTRY_AUTH_TOKEN=$(ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq '.vault.SENTRY_AUTH_TOKEN')

export SENTRY_DSN="${LBA_SERVER_SENTRY_DSN}"
cd "$ROOT_DIR/server"
"./sentry-deploy-server.sh" "${ENVIRONMENT}" "${VERSION}"

export SENTRY_DSN="${LBA_UI_SENTRY_DSN}"
cd "$ROOT_DIR/ui"
"./sentry-deploy-ui.sh" "${ENVIRONMENT}" "${VERSION}"
