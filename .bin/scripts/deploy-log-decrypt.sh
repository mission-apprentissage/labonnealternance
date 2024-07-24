#!/usr/bin/env bash

set -euo pipefail

if [ -z "${1:-}" ]; then
  read -p "Veuillez renseigner l'ID du run: " RUN_ID
else
    readonly RUN_ID="$1"
    shift
fi

if [ -z "${1:-}" ]; then
  read -p "Veuillez renseigner l'ID du job: " JOB_ID
else
    readonly JOB_ID="$1"
    shift
fi

if [[ -z "${ANSIBLE_VAULT_PASSWORD_FILE:-}" ]]; then
  ansible_extra_opts+=("--vault-password-file" "${SCRIPT_DIR}/get-vault-password-client.sh")
else
  echo "Récupération de la passphrase depuis l'environnement variable ANSIBLE_VAULT_PASSWORD_FILE" 
fi

readonly PASSPHRASE="$ROOT_DIR/.bin/SEED_PASSPHRASE.txt"
readonly VAULT_FILE="${ROOT_DIR}/.infra/vault/vault.yml"

delete_cleartext() {
  rm -f "$PASSPHRASE"
}
trap delete_cleartext EXIT


rm -f /tmp/deploy.log.gpg

gh run download "$RUN_ID" -n "logs-$JOB_ID" -D /tmp

ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq '.vault.SEED_GPG_PASSPHRASE' > "$PASSPHRASE"

gpg -d --batch --passphrase-file "$PASSPHRASE" /tmp/deploy.log.gpg
