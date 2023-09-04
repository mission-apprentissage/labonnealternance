#!/usr/bin/env bash
set -euo pipefail

readonly VAULT_FILE="${ROOT_DIR}/.infra/vault/vault.yml"

ansible-vault edit --vault-password-file="${SCRIPT_DIR}/get-vault-password-client.sh" "${VAULT_FILE}"
