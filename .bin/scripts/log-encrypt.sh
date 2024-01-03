#!/usr/bin/env bash

set -euo pipefail

if [ -z "${1:-}" ]; then
  read -p "Veuillez renseigner le fichier log à encrypter: " LOG_FILE
else
  readonly LOG_FILE="$1"
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

ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq '.vault.SEED_GPG_PASSPHRASE' > "$PASSPHRASE"

ls -la cypress/screenshots/*

# Make sur the file exists
touch $LOG_FILE
gpg  -c --cipher-algo twofish --batch --passphrase-file "$PASSPHRASE" -o $LOG_FILE.gpg $LOG_FILE
