#!/usr/bin/env bash

set -euo pipefail

readonly TARGET_DB=${1:?"Merci de préciser le nom de la base de donnée cible"}
shift
readonly PR_NUMBER="${TARGET_DB#preview_}"
readonly PASSPHRASE=$(mktemp passphrase.XXXXXXXXXX)
readonly SEED_ARCHIVE="$(mktemp /tmp/seed-XXXXXXXXXX)"
readonly CONTAINER_SEED_PATH="/tmp/$(basename "$SEED_ARCHIVE")"

cleanup() {
  docker exec "lba_${PR_NUMBER}_mongodb" rm -f "$CONTAINER_SEED_PATH" 2>/dev/null || true
  shred -f -n 10 -u "$SEED_ARCHIVE" "$PASSPHRASE" 2>/dev/null || true
}

trap cleanup EXIT

echo "{{ SEED_GPG_PASSPHRASE }}" > "$PASSPHRASE"
chmod 600 "$PASSPHRASE"

rm "$SEED_ARCHIVE"
gpg -d --batch --passphrase-file "$PASSPHRASE" -o "$SEED_ARCHIVE" "/opt/app/configs/mongodb/seed.gpg"
chmod 600 "$SEED_ARCHIVE"

docker cp "$SEED_ARCHIVE" "lba_${PR_NUMBER}_mongodb:$CONTAINER_SEED_PATH"

# Drop the entire database before restore to avoid duplicate key errors
echo "Dropping database $TARGET_DB if it exists..."
docker exec "lba_${PR_NUMBER}_mongodb" mongosh "mongodb://__system:{{ MONGODB_KEYFILE }}@localhost:27017/$TARGET_DB?authSource=local&directConnection=true" --eval "db.dropDatabase()" || true

# Restore from file copied into the container
echo "Restoring database $TARGET_DB..."
docker exec "lba_${PR_NUMBER}_mongodb" mongorestore \
  --archive="$CONTAINER_SEED_PATH" \
  --nsFrom="labonnealternance.*" \
  --nsTo="$TARGET_DB.*" \
  --drop \
  --gzip \
  "mongodb://__system:{{ MONGODB_KEYFILE }}@localhost:27017/?authSource=local&directConnection=true"
