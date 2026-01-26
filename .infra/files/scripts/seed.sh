#!/usr/bin/env bash

set -euo pipefail

readonly TARGET_DB=${1:?"Merci de préciser le nom de la base de donnée cible"}
shift
readonly SEED_ARCHIVE=$(mktemp seed_archive.XXXXXXXXXX)
readonly PASSPHRASE=$(mktemp passphrase.XXXXXXXXXX)
readonly CONTAINER_SEED_PATH="/tmp/seed_archive_$(date +%s)"

# Get MongoDB container ID
readonly MONGODB_CONTAINER=$(/opt/app/tools/docker-compose.sh ps -q mongodb)

cleanup() {
  # Clean up local files
  shred -f -n 10 -u "$SEED_ARCHIVE" "$PASSPHRASE" 2>/dev/null || true
  # Clean up file in container
  docker exec "$MONGODB_CONTAINER" rm -f "$CONTAINER_SEED_PATH" 2>/dev/null || true
}

trap cleanup EXIT

echo "{{ vault.SEED_GPG_PASSPHRASE }}" > "$PASSPHRASE"

chmod 600 "$PASSPHRASE"

rm -r "$SEED_ARCHIVE"
gpg -d --batch --passphrase-file "$PASSPHRASE" -o "$SEED_ARCHIVE" "/opt/app/configs/mongodb/seed.gpg"
chmod 600 "$SEED_ARCHIVE"

# Drop the entire database before restore to avoid duplicate key errors
echo "Dropping database $TARGET_DB if it exists..."
/opt/app/tools/docker-compose.sh exec -T mongodb mongosh "mongodb://__system:{{vault.MONGODB_KEYFILE}}@localhost:27017/$TARGET_DB?authSource=local&directConnection=true" --eval "db.dropDatabase()" || true

# Copy seed archive into container to avoid pipe/socket issues
echo "Copying seed archive to MongoDB container..."
docker cp "$SEED_ARCHIVE" "$MONGODB_CONTAINER:$CONTAINER_SEED_PATH"

# Restore from local file in container
echo "Restoring database $TARGET_DB..."
/opt/app/tools/docker-compose.sh exec -T mongodb mongorestore \
  --archive="$CONTAINER_SEED_PATH" \
  --nsFrom="labonnealternance.*" \
  --nsTo="$TARGET_DB.*" \
  --drop \
  --gzip \
  "mongodb://__system:{{vault.MONGODB_KEYFILE}}@localhost:27017/?authSource=local&directConnection=true"
