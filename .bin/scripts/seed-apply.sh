#!/usr/bin/env bash

set -euo pipefail

if [ -z "${1:-}" ]; then
    readonly TARGET_DB="mongodb://__system:password@localhost:27017/?authSource=local&directConnection=true"
else
    readonly TARGET_DB="$1"
    shift
fi

echo "base de donnée cible: $TARGET_DB"

readonly SEED_GPG="$ROOT_DIR/.infra/files/configs/mongodb/seed.gpg"
readonly SEED_GZ="$ROOT_DIR/.infra/files/configs/mongodb/seed.gz"
readonly PASSPHRASE="$ROOT_DIR/.bin/SEED_PASSPHRASE.txt"
readonly VAULT_FILE="${ROOT_DIR}/.infra/vault/vault.yml"

read -p "La base de donnée va être écrasée, voulez vous continuer ? [y/N]: " response
case $response in
  [yY][eE][sS]|[yY])
    ;;
  *)
    exit 1
;;
esac

delete_cleartext() {
  rm -f "$SEED_GZ" "$PASSPHRASE"
}
trap delete_cleartext EXIT

ansible-vault view --vault-password-file="$ROOT_DIR/.bin/scripts/get-vault-password-client.sh" "$VAULT_FILE" | yq '.vault.SEED_GPG_PASSPHRASE' > "$PASSPHRASE"

rm -f "$SEED_GZ"
gpg -d --batch --passphrase-file "$PASSPHRASE" -o "$SEED_GZ" "$SEED_GPG"
cat "$SEED_GZ" | /opt/app/tools/docker-compose.sh -f "$ROOT_DIR/docker-compose.yml" exec -iT mongodb mongorestore --archive --nsInclude="labonnealternance.*" --uri="${TARGET_DB}" --drop --gzip

yarn build:dev
yarn cli migrations:up
yarn cli recreate:indexes 
