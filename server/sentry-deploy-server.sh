#!/bin/bash
set -euo pipefail

export ENVIRONMENT="${1:?"Veuillez préciser l'environement"}";
shift;

if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  echo "Missing SENTRY_AUTH_TOKEN";
  exit 1;
fi
if [[ -z "${SENTRY_DSN:-}" ]]; then
  echo "Missing SENTRY_DSN";
  exit 1;
fi

export SENTRY_URL=https://sentry.apprentissage.beta.gouv.fr
export SENTRY_ORG=sentry
export SENTRY_PROJECT=lba-server

../node_modules/.bin/sentry-cli releases deploys "$PUBLIC_VERSION" new -e "${ENVIRONMENT}"
