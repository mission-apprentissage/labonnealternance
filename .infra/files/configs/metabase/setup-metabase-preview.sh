#!/usr/bin/env bash
set -euo pipefail

METABASE_URL="https://metabase.{{dns_name}}"
PROPS=$(curl -sS --retry 5 --retry-all-errors "${METABASE_URL}/api/session/properties")
IS_SETUP=$(echo $PROPS | jq -r '."has-user-setup"')

if [[ $IS_SETUP == "true" ]]; then
  echo 'metabase already setup'
  exit 0
fi

TOKEN=$(echo $PROPS | jq -r '."setup-token"')

curl -sS --retry 5 --retry-all-errors "${METABASE_URL}/api/setup" \
  --header 'Content-Type: application/json' \
  --data-raw "{
    \"token\": \"$TOKEN\",
    \"user\": {
      \"password_confirm\": \"{{ LBA_METABASE_ADMIN_PASS }}\",
      \"password\": \"{{ LBA_METABASE_ADMIN_PASS }}\",
      \"site_name\": \"La bonne alternance\",
      \"email\": \"{{ LBA_METABASE_ADMIN_EMAIL }}\",
      \"last_name\": null,
      \"first_name\": null
    },
    \"prefs\": {
      \"site_name\": \"La bonne alternance\",
      \"site_locale\": \"fr\",
      \"allow_tracking\": false
    }
  }"

echo 'metabase preview setup successfully'
