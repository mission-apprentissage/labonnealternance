#!/usr/bin/env bash

set -euo pipefail

echo "Updating local server/.env & ui/.env"

ansible-galaxy collection install -U community.sops

ANSIBLE_CONFIG="${ROOT_DIR}/.infra/ansible/ansible.cfg" ansible-playbook \
  --limit "local" \
  "${ROOT_DIR}/.infra/ansible/initialize-env.yml"

echo "PUBLIC_VERSION=0.0.0-local" >> "${ROOT_DIR}/server/.env"
echo "COMMIT_HASH=$(git rev-parse --short HEAD)" >> "${ROOT_DIR}/server/.env"

echo "NEXT_PUBLIC_ENV=local" >> "${ROOT_DIR}/ui/.env"
echo "NEXT_PUBLIC_VERSION=0.0.0-local" >> "${ROOT_DIR}/ui/.env"
echo "NEXT_PUBLIC_API_PORT=5001" >> "${ROOT_DIR}/ui/.env"

yarn

# Mot de passe mongot : récupéré depuis server/.env (généré du vault via .env_server),
# écrit dans le fichier que l'image mongot copie au build (Dockerfile.mongot), AVANT services:start.
echo "Provisioning du mot de passe mongot..."
MONGOT_VALUE=$(grep -E '^MONGOT_PASSWORD=' "${ROOT_DIR}/server/.env" | head -1 | cut -d= -f2-)
if [ -z "$MONGOT_VALUE" ]; then
  echo "ERREUR: MONGOT_PASSWORD absent de server/.env (ajoute-le à .infra/.env_server)" >&2
  exit 1
fi
printf '%s' "$MONGOT_VALUE" > "${ROOT_DIR}/.infra/local/mongot_password"

yarn services:start
yarn setup:mongodb

echo "Creating mongotUser in MongoDB..."
# Mot de passe passé via process.env (pas d'interpolation dans la chaîne --eval) → pas de
# corruption sur caractères spéciaux. Identique au fichier baké dans l'image mongot.
# NB : sur un volume MongoDB déjà provisionné, si un mongotUser existe avec un ancien mot de
# passe, ce dropUser/createUser doit le resynchroniser. En cas de mongot en AuthenticationFailed
# (boucle de restart) après un changement de MONGOT_PASSWORD au vault : re-jouer ce bloc, ou
# repartir propre avec `yarn services:clean`. Cf. docs/mongodb/current-behavior.md (Limitations).
docker compose exec -e MONGOT_VALUE="$MONGOT_VALUE" mongodb mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval 'try { db.dropUser("mongotUser") } catch (e) {} db.createUser({ user: "mongotUser", pwd: process.env.MONGOT_VALUE, roles: ["searchCoordinator"] }); print("mongotUser created")' \
  --quiet
docker compose restart mongot

yarn build:dev
yarn cli migrations:up
yarn cli indexes:recreate
