#!/usr/bin/env bash
set -euo pipefail

PR_NUMBER=$1
if ! [[ "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
  echo "Error: Invalid PR number: $PR_NUMBER" >&2
  exit 1
fi

MONGO_URI=$2
METABASE_URL="https://metabase.{{dns_name}}"

SESSION_PAYLOAD=$(jq -n \
  --arg username "{{ LBA_METABASE_ADMIN_EMAIL }}" \
  --arg password "{{ LBA_METABASE_ADMIN_PASS }}" \
  '{"username": $username, "password": $password}')
SESSION=$(curl -sSf -X POST "${METABASE_URL}/api/session" \
  --header 'Content-Type: application/json' \
  --data-raw "$SESSION_PAYLOAD")
TOKEN=$(echo "$SESSION" | jq -r '.id')
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "Error: Failed to authenticate with Metabase" >&2
  exit 1
fi

DB_PAYLOAD=$(jq -n \
  --arg name "MongoDB PR-${PR_NUMBER}" \
  --arg uri "$MONGO_URI" \
  '{
    "engine": "mongo",
    "name": $name,
    "is_on_demand": false,
    "is_full_sync": false,
    "is_sample": false,
    "auto_run_queries": true,
    "details": {
      "use-conn-uri": true,
      "conn-uri": $uri,
      "tunnel-enabled": false,
      "advanced-options": false
    }
  }')
curl -sSf -X POST "${METABASE_URL}/api/database" \
  --header 'Content-Type: application/json' \
  --header "X-Metabase-Session: $TOKEN" \
  --data-raw "$DB_PAYLOAD"

echo "Database MongoDB PR-${PR_NUMBER} added to Metabase"
