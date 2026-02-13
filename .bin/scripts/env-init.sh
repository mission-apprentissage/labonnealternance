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
yarn build:dev
yarn cli migrations:up
yarn cli indexes:recreate
