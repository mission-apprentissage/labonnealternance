#!/usr/bin/env bash

set -euo pipefail

dependencies=(
  "ansible"
  "gpg"
  "node"
  "shred"
  "sshpass"
  "yq"
)

if [[ -z "${CI:-}" ]]; then
  dependencies+=("op")
fi

for command in "${dependencies[@]}"; do
  if ! type -p "$command" > /dev/null; then
    echo "$command missing !"
    exit 1
  fi
done

