#!/usr/bin/env bash

set -euo pipefail

if [ -z "${1:-}" ]; then
    readonly TARGET_DB="mongodb://__system:password@localhost:27017/?authSource=local&directConnection=true"
else
    readonly TARGET_DB="$1"
    shift
fi

echo "base de donnée cible: $TARGET_DB"

read -p "La base de donnée contient-elle des données sensible ? [Y/n]: " response
case $response in
  [nN][oO]|[nN])
    ;;
  *)
    exit 1
;;
esac

readonly SEED_GPG="$ROOT_DIR/.infra/files/configs/mongodb/seed.gpg"
readonly SEED_GZ="$ROOT_DIR/.infra/files/configs/mongodb/seed.gz"
readonly PASSPHRASE="$ROOT_DIR/.bin/SEED_PASSPHRASE.txt"
readonly VAULT_FILE="${ROOT_DIR}/.infra/vault/vault.yml"

delete_cleartext() {
  if [ -f "$SEED_GZ" ]; then
    shred -f -n 10 -u "$SEED_GZ"
  fi

  if [ -f "$PASSPHRASE" ]; then
    shred -f -n 10 -u "$PASSPHRASE"
  fi
}
trap delete_cleartext EXIT

ansible-vault view --vault-password-file="$ROOT_DIR/.bin/scripts/get-vault-password-client.sh" "$VAULT_FILE" | yq -r '.vault.SEED_GPG_PASSPHRASE' > "$PASSPHRASE"

docker compose -f "$ROOT_DIR/docker-compose.yml" up mongodb -d
mkdir -p "$ROOT_DIR/.infra/files/mongodb"

yarn build:dev
yarn cli migrations:up
yarn cli recreate:indexes

docker compose -f "$ROOT_DIR/docker-compose.yml" exec -it mongodb mongodump --uri "$TARGET_DB" --gzip --archive > "$SEED_GZ" 
rm -f "$SEED_GPG"
gpg  -c --cipher-algo twofish --batch --passphrase-file "$PASSPHRASE" -o "$SEED_GPG" "$SEED_GZ"
