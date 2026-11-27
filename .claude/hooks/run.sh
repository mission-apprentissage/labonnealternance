#!/usr/bin/env bash
# Lanceur des hooks Claude Code : choisit Node, puis exécute cli.mjs (cf. .claude/settings.json).
# Pas de `set -e`, à l'inverse de .bin/scripts : seul cli.mjs décide du code de sortie, un 2 fortuit bloquerait la session.

[ "${LBA_HOOKS:-on}" = "off" ] && exit 0

dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd -P) || { echo "[lba-hooks] dossier des hooks introuvable" >&2; exit 1; }

# Node de .node-version s'il est installé par nvm : les hooks héritent sinon de l'alias par défaut de nvm.
want=$(tr -d '[:space:]' < "$dir/../../.node-version" 2>/dev/null)
case "$want" in
  "") ;;
  v*) ;;
  *) want="v$want" ;;
esac
node=""
if [ -n "$want" ] && [ -x "$HOME/.nvm/versions/node/$want/bin/node" ]; then
  node="$HOME/.nvm/versions/node/$want/bin/node"
fi
[ -z "$node" ] && node=$(command -v node 2>/dev/null)
if [ -z "$node" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node "$HOME"/.nvm/versions/node/*/bin/node; do
    [ -x "$candidate" ] && node="$candidate"
  done
fi
[ -z "$node" ] && { echo "[lba-hooks] node introuvable : hooks non exécutés" >&2; exit 1; }

exec "$node" "$dir/cli.mjs" "$@"
