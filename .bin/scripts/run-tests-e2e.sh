#!/usr/bin/env bash

set -euo pipefail

if [ -z "${1:-}" ]; then
  read -p "Veuillez renseigner le type de plateforme (recette|preview): " PLATFORM
else
  readonly PLATFORM="$1"
  shift
fi

if [[ -z "${ANSIBLE_VAULT_PASSWORD_FILE:-}" ]]; then
  ansible_extra_opts+=("--vault-password-file" "${SCRIPT_DIR}/get-vault-password-client.sh")
else
  echo "Récupération de la passphrase depuis l'environnement variable ANSIBLE_VAULT_PASSWORD_FILE" 
fi

readonly VAULT_FILE="${ROOT_DIR}/.infra/vault/vault.yml"
CYPRESS_ENV_FILE="${ROOT_DIR}/cypress.${PLATFORM}.env"
LOG_FILE=/tmp/cypressRun.log

function setCypressEnv() {
  echo "" > $CYPRESS_ENV_FILE
  ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq -o=shell '.vault' | grep -E "^CYPRESS_" >> $CYPRESS_ENV_FILE
  ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq -o=shell ".vault.$PLATFORM" | grep -E "^CYPRESS_" >> $CYPRESS_ENV_FILE
}

echo "" > $LOG_FILE
echo "writing Cypress env variables to $CYPRESS_ENV_FILE"
setCypressEnv > $LOG_FILE 2>&1
echo "Cypress env variables wrote to $CYPRESS_ENV_FILE with success"
echo "Exporting env variables"
export $(cat "$CYPRESS_ENV_FILE" | xargs)
echo "env:" >> $LOG_FILE
cat $CYPRESS_ENV_FILE >> $LOG_FILE
echo "Starting Cypress tests"
yarn e2e:headless >> $LOG_FILE 2>&1
echo "End of Cypress tests"
