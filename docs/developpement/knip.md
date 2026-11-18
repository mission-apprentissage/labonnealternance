# knip — détection de code mort et de dépendances orphelines

`yarn knip` analyse les 3 workspaces (`server`, `shared`, `ui`) et signale : fichiers non
atteignables, dépendances déclarées mais non utilisées, dépendances utilisées mais non déclarées,
exports jamais consommés. Configuration : [`knip.json`](../../knip.json).

```bash
yarn knip                      # sortie texte
yarn knip --reporter json      # chemins complets, pour compter par workspace
yarn knip -p                   # mode production (suffixes `!` de knip.json)
```

## Faux positifs connus

À ne pas « corriger » :

- `nock` (devDependency `server`) : bug knip propre au monorepo. Il est déclaré inutilisé alors
  qu'il est importé dans les tests, et non reproductible sur un projet isolé.
- `sharp` : backend d'optimisation d'images de Next en production, sans import direct. Ne pas le
  supprimer sans valider un build de production.
- `gitleaks-secret-scanner` : appelé depuis `.bin/scripts/gitleaks-check.sh`, et knip n'analyse pas
  les scripts shell.
- `mna` (binaire non listé) : script local `.bin/mna`, que knip ne modélise pas.
- `./tests/utils/setup.ts`, `./tests/utils/globalSetup.ts`, `./tests/setup.ts` (imports non
  résolus) : avec `test.projects`, knip résout `setupFiles` / `globalSetup` depuis la racine au
  lieu du `root` de chaque projet.
- Exports de `shared` : `includeEntryExports: true` et tous ses fichiers en `entry`, le signalement
  est voulu.

Finding réel à traiter : le binaire `dotenv` du script `seed:reference` (`server/package.json`)
n'existe pas, le paquet `dotenv` n'en fournit pas (c'est `dotenv-cli`).

## Pas de gate en CI

knip 6 n'a pas de baseline native (`--save-baseline` répond `Unknown option`) et sort en `exit 1`
sur `main`. Pour le brancher en CI, réduire d'abord les catégories visées à zéro, puis ajouter
`yarn knip --include <catégories> --treat-config-hints-as-errors`. Ne pas utiliser
`--no-exit-code` : un job vert avec des warnings ne se distingue pas d'un job propre.
