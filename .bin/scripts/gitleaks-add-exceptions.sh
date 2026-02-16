#!/usr/bin/env bash

set -euo pipefail

echo "generating report"
yarn run gitleaks-secret-scanner --diff-mode all -f json -r report.json || true

echo "generating fingerprints"
cat gitleaks-fingerprints-baseline.txt > gitleaks-fingerprints-new.txt
cat report.json |jq '.[] | .File + ":" + .RuleID + ":" + .Secret'|cut -d '"' -f2 >> gitleaks-fingerprints-new.txt
cat gitleaks-fingerprints-new.txt|sort|uniq > gitleaks-fingerprints-baseline.txt
rm gitleaks-fingerprints-new.txt

echo "deleting report"
rm report.json

echo "done !"
