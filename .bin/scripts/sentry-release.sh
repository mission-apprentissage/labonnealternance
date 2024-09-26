#!/bin/bash
set -euo pipefail

VERSION=${1:?"Veuillez préciser la version à build"}

COMMIT_ID=$(git rev-parse --short HEAD)
curl https://labonnealternance.apprentissage.beta.gouv.fr/api/healthcheck
PREV_COMMIT_ID=$(curl https://labonnealternance.apprentissage.beta.gouv.fr/api/healthcheck|awk -F 'commitHash' '{print FS $2}'|cut -d'"' -f3)

if [[ -z "${ANSIBLE_VAULT_PASSWORD_FILE:-}" ]]; then
  ansible_extra_opts+=("--vault-password-file" "${SCRIPT_DIR}/get-vault-password-client.sh")
else
  echo "Récupération de la passphrase depuis l'environnement variable ANSIBLE_VAULT_PASSWORD_FILE" 
fi

readonly VAULT_FILE="${ROOT_DIR}/.infra/vault/vault.yml"

LBA_SERVER_SENTRY_DSN=$(ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq '.vault.LBA_SERVER_SENTRY_DSN')
LBA_UI_SENTRY_DSN=$(ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq '.vault.LBA_UI_SENTRY_DSN')
SENTRY_AUTH_TOKEN=$(ansible-vault view "${ansible_extra_opts[@]}" "$VAULT_FILE" | yq '.vault.SENTRY_AUTH_TOKEN')

docker run \
  --platform=linux/amd64 \
  --rm \
  -i \
  --entrypoint /bin/bash \
  -e SENTRY_AUTH_TOKEN="${SENTRY_AUTH_TOKEN}" \
  -e SENTRY_DSN="${LBA_SERVER_SENTRY_DSN}" \
  ghcr.io/mission-apprentissage/mna_lba_server:${VERSION} \
  /app/server/sentry-release-server.sh "mission-apprentissage/labonnealternance" "${COMMIT_ID}" "${PREV_COMMIT_ID}" "${VERSION}"

docker run \
  --platform=linux/amd64 \
  --rm \
  -i \
  --entrypoint /bin/bash \
  -e SENTRY_AUTH_TOKEN="${SENTRY_AUTH_TOKEN}" \
  -e SENTRY_DSN="${LBA_UI_SENTRY_DSN}" \
  ghcr.io/mission-apprentissage/mna_lba_ui:${VERSION}-production \
  /app/ui/sentry-release-ui.sh "mission-apprentissage/labonnealternance" "${COMMIT_ID}" "${PREV_COMMIT_ID}" "${VERSION}"
