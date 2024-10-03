#!/usr/bin/env bash
set -euo pipefail

# echo "Command line interface to view the vault password"
# echo "This file implements Ansible specifications third-party vault tools"
# echo "For more informations see https://docs.ansible.com/ansible/latest/vault_guide/vault_managing_passwords.html#storing-passwords-in-third-party-tools-with-vault-password-client-scripts"

## CHECK UPDATES AND RENEW

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BIN_DIR="$(dirname "${SCRIPT_DIR}")"
readonly ROOT_DIR="$(dirname "${BIN_DIR}")"
readonly VAULT_DIR="${ROOT_DIR}/.infra/vault"
readonly VAULT_FILE="${VAULT_DIR}/vault.yml"

DOCUMENT_CONTENT=$(op document get .vault-password-lba --vault "mna-vault-passwords-common" --account mission-apprentissage.1password.com || echo "")
vault_password_file="${VAULT_DIR}/.vault-password.gpg"
previous_vault_password_file="${VAULT_DIR}/.vault-password-previous.gpg"

if [ ! -f "$vault_password_file" ]; then
    echo "$DOCUMENT_CONTENT" > "$vault_password_file"
    echo "vault password créé avec succès."

# Si le fichier existe et que son contenu est différent
elif [ ! -z "$DOCUMENT_CONTENT" ] && [ "$DOCUMENT_CONTENT" != "$(cat "${vault_password_file}")" ]; then
    # Renommer l'ancien fichier
    mv "$vault_password_file" "$previous_vault_password_file"
    # echo "vault-password existant renommé en .vault-password-previous.gpg."
    
    # Créer un nouveau fichier avec le contenu actuel
    echo "$DOCUMENT_CONTENT" > "$vault_password_file"
    # echo "Nouveau vault-password créé avec succès."

    previous_vault_password_file_clear_text="${VAULT_DIR}/prev_clear_text"
    vault_password_file_clear_text="${VAULT_DIR}/new_clear_text"

    delete_cleartext() {
      rm -f "$previous_vault_password_file_clear_text" "$vault_password_file_clear_text"
    }
    trap delete_cleartext EXIT

    gpg --quiet --batch --use-agent --decrypt "${previous_vault_password_file}" > "${previous_vault_password_file_clear_text}"
    gpg --quiet --batch --use-agent --decrypt "${vault_password_file}" > "${vault_password_file_clear_text}"
    
    ansible-vault rekey \
    --vault-id "${previous_vault_password_file_clear_text}" \
    --new-vault-id "${vault_password_file_clear_text}" \
    "${VAULT_FILE}" > /dev/null || true

    delete_cleartext
fi


decrypt_password() {
  ## Decrypt

  if test -f "${vault_password_file}"; then
    gpg --quiet --batch --use-agent --decrypt "${vault_password_file}"
  else
    #Allows to run playbooks with --vault-password-file even if password has not been yet generated
    echo "not-yet-generated"
  fi

  gpgconf --kill gpg-agent
}


decrypt_password
