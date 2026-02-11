#!/usr/bin/env bash
set -euo pipefail

PROPS=$(curl -sS --retry 5 --retry-all-errors https://{{dns_name}}/metabase/api/session/properties)
IS_SETUP=$(echo $PROPS | jq -r '."has-user-setup"')

if [[ $IS_SETUP == "true" ]]; then
  echo 'metabase already setup'
  exit 0;
fi

TOKEN=$(echo $PROPS | jq -r '."setup-token"')

curl -sS --retry 5 --retry-all-errors https://{{dns_name}}/metabase/api/setup \
--header 'Content-Type: application/json' \
--data-raw "{
    \"token\": \"$TOKEN\",
    \"user\": {
        \"password_confirm\": \"{{ LBA_METABASE_ADMIN_PASS }}\",
        \"password\": \"{{ LBA_METABASE_ADMIN_PASS }}\",
        \"site_name\": \"boite aux lettres\",
        \"email\": \"{{ LBA_METABASE_ADMIN_EMAIL }}\",
        \"last_name\": null,
        \"first_name\": null
    },
    \"database\": {
        \"is_on_demand\": false,
        \"is_full_sync\": false,
        \"is_sample\": false,
        \"cache_ttl\": null,
        \"refingerprint\": false,
        \"auto_run_queries\": true,
        \"schedules\": {},
        \"details\": {
            \"use-conn-uri\": true,
            \"conn-uri\": \"{{ LBA_METABASE_MONGODB_URI }}\",
            \"tunnel-enabled\": false,
            \"advanced-options\": true,
            \"ssl\": true
        },
        \"name\": \"MongoDB\",
        \"engine\": \"mongo\"
    },
    \"invite\": null,
    \"prefs\": {
        \"site_name\": \"boite aux lettres\",
        \"site_locale\": \"fr\",
        \"allow_tracking\": false
    }
}"

echo 'metabase setup successfully'
