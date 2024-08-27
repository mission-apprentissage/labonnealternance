#!/usr/bin/env bash
set -euo pipefail

OS_NAME=$(uname -s)

ansible_extra_opts+=("--vault-password-file" "${SCRIPT_DIR}/get-vault-password-client.sh")
readonly VAULT_FILE="${ROOT_DIR}/.infra/vault/vault.yml"
CYPRESS_ENV_FILE="./cypress.env"

echo "Creating $CYPRESS_ENV_FILE"
echo "" > $CYPRESS_ENV_FILE
ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq -o=shell '.vault' | grep -E "^CYPRESS_" >> $CYPRESS_ENV_FILE
ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq -o=shell ".vault.local" | grep -E "^CYPRESS_" >> $CYPRESS_ENV_FILE

echo "Updating local server/.env & ui/.env"
ANSIBLE_CONFIG="${ROOT_DIR}/.infra/ansible/ansible.cfg" ansible all \
  --limit "local" \
  -m template \
  -a "src=\"${ROOT_DIR}/.infra/.env_server\" dest=\"${ROOT_DIR}/server/.env\"" \
  --extra-vars "@${ROOT_DIR}/.infra/vault/vault.yml" \
  --vault-password-file="${SCRIPT_DIR}/get-vault-password-client.sh"
ANSIBLE_CONFIG="${ROOT_DIR}/.infra/ansible/ansible.cfg" ansible all \
  --limit "local" \
  -m template \
  -a "src=\"${ROOT_DIR}/.infra/.env_ui\" dest=\"${ROOT_DIR}/ui/.env\"" \
  --extra-vars "@${ROOT_DIR}/.infra/vault/vault.yml" \
  --vault-password-file="${SCRIPT_DIR}/get-vault-password-client.sh"

echo "PUBLIC_VERSION=0.0.0-local" >> "${ROOT_DIR}/server/.env"

echo "NEXT_PUBLIC_ENV=local" >> "${ROOT_DIR}/ui/.env"
echo "NEXT_PUBLIC_VERSION=0.0.0-local" >> "${ROOT_DIR}/ui/.env"
echo "NEXT_PUBLIC_API_PORT=5001" >> "${ROOT_DIR}/ui/.env"

yarn

if [ "$OS_NAME" == "Linux" ]; then
    chmod 440 "${ROOT_DIR}/.infra/local/mongo_keyfile"
    chown 999:999 "${ROOT_DIR}/.infra/local/mongo_keyfile"
elif [ "$OS_NAME" == "Darwin" ]; then
    chmod 400 "${ROOT_DIR}/.infra/local/mongo_keyfile"
else
    echo "Système d'exploitation non pris en charge : $OS_NAME"
fi

yarn
chmod 400 "${ROOT_DIR}/.infra/local/mongo_keyfile"
yarn services:start
yarn setup:mongodb
yarn build:dev
yarn cli migrations:up
yarn cli recreate:indexes
