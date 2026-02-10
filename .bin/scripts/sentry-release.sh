#!/usr/bin/env bash

set -euo pipefail

VERSION=${1:?"Veuillez préciser la version à build"}

COMMIT_ID=$(git rev-parse --short HEAD)
PREV_COMMIT_ID=$(curl https://labonnealternance.apprentissage.beta.gouv.fr/api/healthcheck | awk -F 'commitHash' '{print FS $2}' | cut -d'"' -f3)

LBA_SERVER_SENTRY_DSN=$(sops --decrypt --extract '["LBA_SERVER_SENTRY_DSN"]' .infra/env.global.yml)
LBA_UI_SENTRY_DSN=$(sops --decrypt --extract '["LBA_UI_SENTRY_DSN"]' .infra/env.global.yml)
SENTRY_AUTH_TOKEN=$(sops --decrypt --extract '["SENTRY_AUTH_TOKEN"]' .infra/env.global.yml)

export SENTRY_DSN="${LBA_SERVER_SENTRY_DSN}"
cd "$ROOT_DIR/server"
"./sentry-release-server.sh" "mission-apprentissage/labonnealternance" "${COMMIT_ID}" "${PREV_COMMIT_ID}" "${VERSION}"

export SENTRY_DSN="${LBA_UI_SENTRY_DSN}"
cd "$ROOT_DIR/ui"
"./sentry-release-ui.sh" "mission-apprentissage/labonnealternance" "${COMMIT_ID}" "${PREV_COMMIT_ID}" "${VERSION}"
