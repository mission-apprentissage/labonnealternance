#!/usr/bin/env bash

set -euo pipefail

VERSION=${1:?"Veuillez préciser la version à build"}

COMMIT_ID=$(git rev-parse --short HEAD)
PREV_COMMIT_ID=$(curl https://labonnealternance.apprentissage.beta.gouv.fr/api/healthcheck | awk -F 'commitHash' '{print FS $2}' | cut -d'"' -f3)

export SENTRY_AUTH_TOKEN=$(sops --decrypt --extract '["SENTRY_AUTH_TOKEN"]' ${ROOT_DIR}/.infra/env.global.yml)

export SENTRY_DSN=$(sops --decrypt --extract '["LBA_SERVER_SENTRY_DSN"]' ${ROOT_DIR}/.infra/env.global.yml)
cd "$ROOT_DIR/server"
"./sentry-release-server.sh" "mission-apprentissage/labonnealternance" "${COMMIT_ID}" "${PREV_COMMIT_ID}" "${VERSION}"

export SENTRY_DSN=$(sops --decrypt --extract '["LBA_UI_SENTRY_DSN"]' ${ROOT_DIR}/.infra/env.global.yml)
cd "$ROOT_DIR/ui"
"./sentry-release-ui.sh" "mission-apprentissage/labonnealternance" "${COMMIT_ID}" "${PREV_COMMIT_ID}" "${VERSION}"
