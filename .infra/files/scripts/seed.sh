#!/usr/bin/env bash

set -euo pipefail

readonly TARGET_DB=${1:?"Merci de préciser le nom de la base de donnée cible"}
shift
readonly PASSPHRASE=$(mktemp passphrase.XXXXXXXXXX)
# Decrypt to mounted volume so MongoDB container can access it directly
readonly SEED_ARCHIVE="$(mktemp -p /opt/app/configs/mongodb/ seed-XXXXXXXXXX)"
readonly CONTAINER_SEED_PATH="/etc/mongod/$(basename "$SEED_ARCHIVE")"

cleanup() {
  shred -f -n 10 -u "$SEED_ARCHIVE" "$PASSPHRASE" 2>/dev/null || true
}

trap cleanup EXIT

echo "{{ SEED_GPG_PASSPHRASE }}" > "$PASSPHRASE"
chmod 600 "$PASSPHRASE"

rm "$SEED_ARCHIVE"
gpg -d --batch --passphrase-file "$PASSPHRASE" -o "$SEED_ARCHIVE" "/opt/app/configs/mongodb/seed.gpg"
chmod 600 "$SEED_ARCHIVE"

# Drop the entire database before restore to avoid duplicate key errors
echo "Dropping database $TARGET_DB if it exists..."
/opt/app/tools/docker-compose.sh exec -T mongodb mongosh "mongodb://__system:{{ MONGODB_KEYFILE }}@localhost:27017/$TARGET_DB?authSource=local&directConnection=true" --eval "db.dropDatabase()" || true

# Restore from file accessible via mounted volume
echo "Restoring database $TARGET_DB..."
/opt/app/tools/docker-compose.sh exec -T mongodb mongorestore \
  --archive="$CONTAINER_SEED_PATH" \
  --nsFrom="labonnealternance.*" \
  --nsTo="$TARGET_DB.*" \
  --drop \
  --gzip \
  "mongodb://__system:{{ MONGODB_KEYFILE }}@localhost:27017/?authSource=local&directConnection=true"
