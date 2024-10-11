#!/bin/bash
set -euo pipefail

export REPO="${1:?"Veuillez préciser le repository"}";
shift;

export COMMIT_ID="${1:?"Veuillez préciser le commit ID"}"
shift;

export PREV_COMMIT_ID="${1:?"Veuillez préciser le commit ID précédent"}"
shift;

export PUBLIC_VERSION="${1:?"Veuillez préciser la version"}";
shift;

if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  echo "Missing SENTRY_AUTH_TOKEN";
  exit 1;
fi
if [[ -z "${SENTRY_DSN:-}" ]]; then
  echo "Missing SENTRY_DSN";
  exit 1;
fi

export SENTRY_URL=https://sentry.apprentissage.beta.gouv.fr
export SENTRY_ORG=sentry
export SENTRY_PROJECT=lba-ui

../node_modules/.bin/sentry-cli releases new "$PUBLIC_VERSION"
../node_modules/.bin/sentry-cli releases set-commits "$PUBLIC_VERSION" --commit "${REPO}@${PREV_COMMIT_ID}..${COMMIT_ID}"
../node_modules/.bin/sentry-cli sourcemaps inject ./.next 
ignoredFiles=""
for file in $(find ./.next/static |grep ".js.map") ; do 
  echo "analyzing $file"
  sourceCount=$(cat "$file" | jq ".sources" | grep -v "/node_modules/" | wc -l)
  if [ "$sourceCount" -eq "2" ] ; then
    finalFilePath=$(basename $file)
    jsFile=$(echo "$finalFilePath" | grep -Po '.*(?=\.)')
    # suppression des fichiers contenant uniquement des sources node_modules
    ignoredFiles+=" --ignore */$finalFilePath --ignore */$jsFile"
  fi
done
echo "ignored files: $ignoredFiles"

../node_modules/.bin/sentry-cli sourcemaps upload -r $PUBLIC_VERSION --url-prefix "~/_next/static" \
  --ignore "*.css" \
  --ignore "*.css.map" \
  --ignore "**/_buildManifest.js" \
  --ignore "**/_ssgManifest.js" \
  --ignore "*/polyfills-*.js" \
  $ignoredFiles \
  --ignore-file .gitignore \
  ./.next/static
../node_modules/.bin/sentry-cli releases finalize "$PUBLIC_VERSION"
