#!/usr/bin/env bash

set -euo pipefail

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

ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq '.vault.SEED_GPG_PASSPHRASE' > "$PASSPHRASE"

# Make sur the file exists
touch /tmp/deploy_error.log
gpg  -c --cipher-algo twofish --batch --passphrase-file "$PASSPHRASE" -o /tmp/deploy_error.log.gpg /tmp/deploy_error.log
