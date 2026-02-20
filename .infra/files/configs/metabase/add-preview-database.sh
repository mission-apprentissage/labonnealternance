#!/usr/bin/env bash
set -euo pipefail

PR_NUMBER=$1
MONGO_URI=$2
METABASE_URL="https://metabase.{{dns_name}}"

SESSION=$(curl -sS -X POST "${METABASE_URL}/api/session" \
  --header 'Content-Type: application/json' \
  --data-raw "{\"username\": \"{{ LBA_METABASE_ADMIN_EMAIL }}\", \"password\": \"{{ LBA_METABASE_ADMIN_PASS }}\"}")
TOKEN=$(echo $SESSION | jq -r '.id')

curl -sS -X POST "${METABASE_URL}/api/database" \
  --header 'Content-Type: application/json' \
  --header "X-Metabase-Session: $TOKEN" \
  --data-raw "{
    \"engine\": \"mongo\",
    \"name\": \"MongoDB PR-${PR_NUMBER}\",
    \"is_on_demand\": false,
    \"is_full_sync\": false,
    \"is_sample\": false,
    \"auto_run_queries\": true,
    \"details\": {
      \"use-conn-uri\": true,
      \"conn-uri\": \"${MONGO_URI}\",
      \"tunnel-enabled\": false,
      \"advanced-options\": false
    }
  }"

echo "Database MongoDB PR-${PR_NUMBER} added to Metabase"
