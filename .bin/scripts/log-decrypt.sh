#!/usr/bin/env bash

set -euo pipefail

if [ -z "${1:-}" ]; then
  read -p "Veuillez renseigner l'ID du run: " RUN_ID
else
  readonly RUN_ID="$1"
  shift
fi

if [ -z "${1:-}" ]; then
  read -p "Veuillez renseigner le nom de l'archive log: " LOG_NAME
else
  readonly LOG_NAME="$1"
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
  if [ -f "$PASSPHRASE" ]; then
    shred -f -n 10 -u "$PASSPHRASE"
  fi
}
trap delete_cleartext EXIT

rm -rf /tmp/decrypt
gh run download "$RUN_ID" -n $LOG_NAME -D /tmp/decrypt

ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq -r '.vault.SEED_GPG_PASSPHRASE' > "$PASSPHRASE"

mkdir -p ./tmp

for filename in $(ls /tmp/decrypt) ; do
  targetFile="./tmp/${filename%.gpg}"
  echo "decoding /tmp/decrypt/$filename into $targetFile"
  gpg -d --batch --passphrase-file "$PASSPHRASE" /tmp/decrypt/$filename > $targetFile
done
