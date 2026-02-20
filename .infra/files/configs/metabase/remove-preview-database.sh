#!/usr/bin/env bash
set -euo pipefail

PR_NUMBER=$1
METABASE_URL="https://metabase.{{dns_name}}"

SESSION=$(curl -sS -X POST "${METABASE_URL}/api/session" \
  --header 'Content-Type: application/json' \
  --data-raw "{\"username\": \"{{ LBA_METABASE_ADMIN_EMAIL }}\", \"password\": \"{{ LBA_METABASE_ADMIN_PASS }}\"}")
TOKEN=$(echo $SESSION | jq -r '.id')

DB_ID=$(curl -sS "${METABASE_URL}/api/database" \
  --header "X-Metabase-Session: $TOKEN" | \
  jq -r ".data[] | select(.name == \"MongoDB PR-${PR_NUMBER}\") | .id")

if [[ -z "$DB_ID" || "$DB_ID" == "null" ]]; then
  echo "Database PR-${PR_NUMBER} not found in Metabase, skipping"
  exit 0
fi

curl -sS -X DELETE "${METABASE_URL}/api/database/${DB_ID}" \
  --header "X-Metabase-Session: $TOKEN"

echo "Database MongoDB PR-${PR_NUMBER} removed from Metabase"
