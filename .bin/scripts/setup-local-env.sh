#!/usr/bin/env bash
set -euo pipefail

echo "Updating local server/.env & ui/.env"
ANSIBLE_CONFIG="${ROOT_DIR}/.infra/ansible/ansible.cfg" ansible all \
  --limit "local" \
  -m template \
  -a "src=\"${ROOT_DIR}/.infra/.env_server\" dest=\"${ROOT_DIR}/server/.env\"" \
  -a "src=\"${ROOT_DIR}/.infra/.env_ui\" dest=\"${ROOT_DIR}/ui/.env\"" \
  --extra-vars "@${ROOT_DIR}/.infra/vault/vault.yml" \
  --vault-password-file="${SCRIPT_DIR}/get-vault-password-client.sh"

echo "NEXT_PUBLIC_ENV=local" >> "${ROOT_DIR}/ui/.env"
echo "NEXT_PUBLIC_VERSION=0.0.0-local" >> "${ROOT_DIR}/ui/.env"
echo "NEXT_PUBLIC_API_PORT=5001" >> "${ROOT_DIR}/ui/.env"
