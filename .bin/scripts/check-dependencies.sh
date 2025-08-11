#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${CI:-}" ]]; then

  dependencies=(
    "ansible"
    "gpg"
    "shred"
    "yq"
    "node"
    "op"
  )

  for command in "${dependencies[@]}"; do
    if ! type -p "$command" > /dev/null; then
      echo "$command missing !"
      exit 1
    fi
  done

fi
