#!/bin/sh

# A hook script to verify that we don't commit files that could contain sensible data or credentials like json, csv, xls(x) or .env

sensible_files_pattern="\.(csv|xls|xls(x?)|json|env)$"
exception="(package.json|custom-environment-variables.json|example.json"
exception="$exception|manifest.json|settings.json|zapatosconfig.json|package-lock.json|coverage-final.json|extensions.json|terminals.json"
exception="$exception|DECA_Extraction MIA-Fake.csv|referentiel-reseau-amue.csv"
exception="$exception|docker-bake.json|eslintrc.json|app.json|tsconfig.json|.mocharc.json"
exception="$exception|launch.json||docker-bake.json"
exception="$exception|modele-import.xlsx"
exception="$exception)$|cypress/(.*).json"

files=$(git diff --cached --name-only | grep -v -E "$exception" | grep -E "$sensible_files_pattern")
if [ -z "$files" ]; then
  exit 0
fi

echo
echo "ERROR: Preventing commit of potentially sensible files:"
echo
echo "$files" | sed "s/^/   /"
echo
echo "Either reset those files, add them to .gitignore or remove them."
echo
echo "If you know what you are doing, please double-check that you are not commiting"
echo "any credentials, password or sensible data and run git commit again with --no-verify."
echo
exit 1
