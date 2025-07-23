#!/usr/bin/env bash

set -euo pipefail

if [ -z "${1:-}" ]; then
  read -p "Veuillez renseigner le fichier à encrypter: " TO_ENCRYPT_FILE
else
  readonly TO_ENCRYPT_FILE="$1"
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
  shred -f -n 10 -u "$PASSPHRASE"
}
trap delete_cleartext EXIT

ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq -r '.vault.SEED_GPG_PASSPHRASE' > "$PASSPHRASE"

# Make sur the file exists
touch $TO_ENCRYPT_FILE
gpg  -c --cipher-algo twofish --batch --passphrase-file "$PASSPHRASE" -o $TO_ENCRYPT_FILE.gpg $TO_ENCRYPT_FILE
