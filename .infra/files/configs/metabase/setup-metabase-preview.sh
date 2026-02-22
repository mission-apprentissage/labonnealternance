#!/usr/bin/env bash
set -euo pipefail

METABASE_URL="https://metabase.{{dns_name}}"
PROPS=$(curl -sSf --retry 5 --retry-all-errors "${METABASE_URL}/api/session/properties")
IS_SETUP=$(echo "$PROPS" | jq -r '."has-user-setup"')

if [[ "$IS_SETUP" == "true" ]]; then
  echo 'metabase already setup'
  exit 0
fi

TOKEN=$(echo "$PROPS" | jq -r '."setup-token"')
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "Error: Failed to retrieve setup token" >&2
  exit 1
fi

SETUP_PAYLOAD=$(jq -n \
  --arg token "$TOKEN" \
  --arg password "{{ LBA_METABASE_ADMIN_PASS }}" \
  --arg email "{{ LBA_METABASE_ADMIN_EMAIL }}" \
  '{
    "token": $token,
    "user": {
      "password_confirm": $password,
      "password": $password,
      "site_name": "La bonne alternance",
      "email": $email,
      "last_name": null,
      "first_name": null
    },
    "prefs": {
      "site_name": "La bonne alternance",
      "site_locale": "fr",
      "allow_tracking": false
    }
  }')

curl -sSf --retry 5 --retry-all-errors "${METABASE_URL}/api/setup" \
  --header 'Content-Type: application/json' \
  --data-raw "$SETUP_PAYLOAD"

echo 'metabase preview setup successfully'
