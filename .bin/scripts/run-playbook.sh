#!/usr/bin/env bash

set -euo pipefail

readonly PLAYBOOK_NAME=${1:?"Merci de le nom du playbook"}
shift
readonly ENV_FILTER=${1:?"Merci de préciser un ou plusieurs environnements (ex. recette ou production)"}
shift
readonly PRODUCT_NAME=lba

function runPlaybook() {
  echo "Lancement du playbook ${PLAYBOOK_NAME} pour l'environnement ${ENV_FILTER}..."

  local ansible_extra_opts=()
  if [[ -z "${ANSIBLE_BECOME_PASS:-}" ]]; then
    if [[ $* != *"pass"* ]]; then
        local become_pass=$(op read op://Private/${PRODUCT_NAME}-$ENV_FILTER/password 2> /dev/null);
        if [ -z $become_pass ]; then
          echo "Si vous avez 1password CLI, il est possible de récupérer le password automatiquement"
          echo "Pour cela, ajouter le dans le vault "Private" l'item ${PRODUCT_NAME}-$ENV_FILTER avec le champs password"
          ansible_extra_opts+=("--ask-become-pass")
        else
          echo "Récupération du mot de passe 'become_pass' depuis 1password" 
          ansible_extra_opts+=("-e ansible_become_password='$become_pass'")
        fi;
    fi
  else
    echo "Récupération du mot de passe 'become_pass' depuis l'environnement variable ANSIBLE_BECOME_PASS" 
  fi

  if [[ -z "${ANSIBLE_REMOTE_USER:-}" ]]; then
    if [[ $* != *"--user"* ]]; then
        local username=$(op read op://Private/${PRODUCT_NAME}-$ENV_FILTER/username 2> /dev/null);
        if [ -z $username ]; then
          echo "Si vous avez 1password CLI, il est possible de récupérer le username automatiquement"
          echo "Pour cela, ajouter le dans le vault "Private" l'item ${PRODUCT_NAME}-$ENV_FILTER avec le champs username"
        else
          echo "Récupération du username depuis 1password" 
          ansible_extra_opts+=("--user" $username)
        fi;
    fi
  else
    echo "Récupération du username depuis l'environnement variable ANSIBLE_REMOTE_USER" 
  fi

  # This env-vars is used by CI to decrypt
  if [[ -z "${ANSIBLE_VAULT_PASSWORD_FILE:-}" ]]; then
    ansible_extra_opts+=("--vault-password-file" "${SCRIPT_DIR}/get-vault-password-client.sh")
  else
    echo "Récupération de la passphrase depuis l'environnement variable ANSIBLE_VAULT_PASSWORD_FILE" 
  fi

  ANSIBLE_CONFIG="${ROOT_DIR}/.infra/ansible/ansible.cfg" ansible-playbook \
      --limit "${ENV_FILTER}" \
      "${ansible_extra_opts[@]}" \
      "${ROOT_DIR}/.infra/ansible/${PLAYBOOK_NAME}" \
      "$@"
}

# Do not show error log in CI
# Do not remove this behavior as displaying errors can reveal secrets
if [[ -z "${CI:-}" ]]; then
  runPlaybook "$@"
else
  runPlaybook "$@" &> /tmp/deploy.log
fi;
