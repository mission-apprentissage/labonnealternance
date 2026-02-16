#!/usr/bin/env bash

set -euo pipefail

echo "generating report"
yarn run gitleaks-secret-scanner --diff-mode all -f json -r report.json || true

TMP_FINGERPRINTS="gitleaks-fingerprints-tmp.txt"

echo "generating fingerprints"
cat report.json |jq '.[] | .File + ":" + .RuleID + ":" + .Secret'|cut -d '"' -f2|sort|uniq > $TMP_FINGERPRINTS

echo "deleting report"
rm report.json

HAS_ERROR="0"
# diff -y gitleaks-fingerprints-baseline.txt $TMP_FINGERPRINTS || HAS_ERROR="1"

while read line; do
  grepResult=$(grep "^$line$" gitleaks-fingerprints-baseline.txt || true)
  if [ -z "$grepResult" ] ; then
    HAS_ERROR="1"
    echo "missing secret: $line"
  fi
done < $TMP_FINGERPRINTS

rm $TMP_FINGERPRINTS
if [ $HAS_ERROR = "1" ] ; then
    echo "❌ new errors detected !"
    exit 1
else
    echo "✅ no new error"
fi


