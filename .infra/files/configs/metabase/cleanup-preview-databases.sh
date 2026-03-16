#!/usr/bin/env bash
set -euo pipefail

METABASE_URL="https://metabase.{{dns_name}}"
GITHUB_REPO="mission-apprentissage/labonnealternance"

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

echo "Fetching preview databases from Metabase..."
DATABASES=$(curl -sSf "${METABASE_URL}/api/database" \
  --header "X-Metabase-Session: $TOKEN" | \
  jq -r '.data[] | select(.name | test("^MongoDB PR-[0-9]+$")) | "\(.id) \(.name)"')

if [[ -z "$DATABASES" ]]; then
  echo "No preview databases found in Metabase."
  exit 0
fi

while IFS= read -r line; do
  DB_ID=$(echo "$line" | awk '{print $1}')
  PR_NUMBER=$(echo "$line" | grep -oE '[0-9]+$')

  PR_RESPONSE=$(curl -sS "https://api.github.com/repos/${GITHUB_REPO}/pulls/${PR_NUMBER}" \
    --header "Accept: application/vnd.github+json")
  PR_STATE=$(echo "$PR_RESPONSE" | jq -r '.state // "not_found"')

  if [[ "$PR_STATE" == "open" ]]; then
    echo "PR-${PR_NUMBER}: open — skipping"
  else
    echo "PR-${PR_NUMBER}: ${PR_STATE} — removing database (id=${DB_ID})"
    curl -sSf -X DELETE "${METABASE_URL}/api/database/${DB_ID}" \
      --header "X-Metabase-Session: $TOKEN"
    echo "  -> removed"
  fi
done <<< "$DATABASES"

echo "Cleanup done."
