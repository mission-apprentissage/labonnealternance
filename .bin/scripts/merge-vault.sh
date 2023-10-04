#!/bin/bash

set -e

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BIN_DIR="$(dirname "${SCRIPT_DIR}")"
readonly ROOT_DIR="$(dirname "${BIN_DIR}")"
readonly VAULT_DIR="${ROOT_DIR}/.infra/vault"
readonly VAULT_FILE="${VAULT_DIR}/vault.yml"

ancestor_version=$1
current_version=$2
other_version=$3

ancestor_tempfile=$(mktemp vault-tmp-ancestor.XXXXXXXXXX)
current_tempfile=$(mktemp vault-tmp-current.XXXXXXXXXX)
other_tempfile=$(mktemp vault-tmp-other.XXXXXXXXXX)
pass_file=$(mktemp vault-pass.XXXXXXXXXX)
chmod 600 $pass_file

delete_tempfiles() {
  rm -f "$ancestor_tempfile" "$current_tempfile" "$other_tempfile" "$pass_file"
}
trap delete_tempfiles EXIT

${SCRIPT_DIR}/get-vault-password-client.sh > $pass_file
ansible-vault decrypt --vault-password-file="$pass_file" --output "$ancestor_tempfile" "$ancestor_version"
ansible-vault decrypt --vault-password-file="$pass_file" --output "$current_tempfile" "$current_version"
ansible-vault decrypt --vault-password-file="$pass_file" --output "$other_tempfile" "$other_version"

# Git diff return exit code > 0 when conflict
# We still want to merge the file with conflicts to let user resolve manually
set +e
git --no-pager diff --no-index "$ancestor_tempfile" "$other_tempfile"
git merge-file -L current -L ancestor -L other "$current_tempfile" "$ancestor_tempfile" "$other_tempfile"
EXIT_CODE=$?
set -e

ansible-vault encrypt --vault-password-file="$pass_file" --output "$current_version" "$current_tempfile"

exit $EXIT_CODE
