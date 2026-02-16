#!/usr/bin/env bash

set -euo pipefail

echo "generating report"
yarn run gitleaks-secret-scanner --diff-mode all -f json -r report.json || true

TMP_FINGERPRINTS="gitleaks-fingerprints-tmp.txt"

echo "generating fingerprints"
cat report.json |jq '.[] | .Fingerprint + ":" + .Secret'|cut -d '"' -f2|sort > $TMP_FINGERPRINTS

echo "deleting report"
rm report.json

HAS_ERROR="0"
diff -y $TMP_FINGERPRINTS gitleaks-fingerprints-baseline.txt || HAS_ERROR="1"
rm $TMP_FINGERPRINTS

if [ $HAS_ERROR = "1" ] ; then
    echo "❌ new errors detected !"
    exit 1
else
    echo "✅ no new error"
fi


