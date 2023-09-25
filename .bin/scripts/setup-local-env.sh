#!/usr/bin/env bash
set -euo pipefail

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
echo "NEXT_PUBLIC_ESPACE_PRO_PORT=3001" >> "${ROOT_DIR}/ui/.env"

echo "REACT_APP_ENV=local" > "${ROOT_DIR}/ui_espace_pro/.env"
echo "REACT_APP_VERSION=0.0.0-local" >> "${ROOT_DIR}/ui_espace_pro/.env"
echo "REACT_APP_API_PORT=5001" >> "${ROOT_DIR}/ui_espace_pro/.env"
echo "PORT=3001" >> "${ROOT_DIR}/ui_espace_pro/.env"
echo "REACT_APP_UI_PORT=3000" >> "${ROOT_DIR}/ui_espace_pro/.env"
echo "SKIP_PREFLIGHT_CHECK=true" >> "${ROOT_DIR}/ui_espace_pro/.env"
echo "DISABLE_ESLINT_PLUGIN=true" >> "${ROOT_DIR}/ui_espace_pro/.env"
