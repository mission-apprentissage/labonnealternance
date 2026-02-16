#!/usr/bin/env bash

set -euo pipefail

echo "generating report"
yarn run gitleaks-secret-scanner --diff-mode all -f json -r report.json || true

echo "generating fingerprints"
cat report.json |jq '.[] | .Fingerprint + ":" + .Secret'|cut -d '"' -f2|sort > gitleaks-fingerprints-baseline.txt

echo "deleting report"
rm report.json

echo "done !"
