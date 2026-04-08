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
yarn services:start
yarn setup:mongodb

echo "Creating mongotUser in MongoDB..."
MONGOT_PWD=$(sops --decrypt --extract '["MONGOT_PASSWORD"]' "${ROOT_DIR}/.infra/env.global.yml")
docker compose exec mongodb mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval "try { db.createUser({ user: 'mongotUser', pwd: '${MONGOT_PWD}', roles: ['searchCoordinator'] }); print('mongotUser created') } catch(e) { if (e.code === 51003) { print('mongotUser already exists, skipping') } else { throw e } }" \
  --quiet
docker compose restart mongot

yarn build:dev
yarn cli migrations:up
yarn cli indexes:recreate
