# knip — détection de code mort et de dépendances orphelines

`yarn knip` analyse les 3 workspaces (`server`, `shared`, `ui`) et signale : fichiers non
atteignables, dépendances déclarées mais non utilisées, dépendances utilisées mais non déclarées,
exports jamais consommés. Configuration : [`knip.json`](../../knip.json).

```bash
yarn knip
```

## Pourquoi knip était cassé (et ne l'était pas visiblement)

Le repo est passé à **TypeScript 7** (le paquet du compilateur natif). knip 5 déclarait
`peerDependencies: { "typescript": ">=5.0.4 <7" }` et appelait l'API du compilateur JS legacy.
Sous TS 7 cette API n'existe plus :

```
$ node -e "const ts=require('typescript'); console.log(typeof ts.getDefaultLibFilePath)"
undefined

$ yarn knip
TypeError: ts.getDefaultLibFilePath is not a function
    at node_modules/knip/dist/typescript/create-hosts.js:6:37
```

`yarn knip` plantait donc **immédiatement**, sur toutes les branches. Comme le script n'était pas
branché en CI, personne ne le voyait : `knip.json` avait l'air d'un garde-fou actif alors qu'aucune
exécution ne pouvait aboutir.

**Correctif : knip 6.** knip 6 a supprimé toute dépendance au compilateur TypeScript ; il parse et
résout avec `oxc-parser` / `oxc-resolver` / `get-tsconfig`, et n'a plus de `peerDependencies` du
tout. Il tourne donc sous TS 7 sans adaptation, en **827 ms** sur ce repo (`yarn knip -u`). Le
schéma de configuration est inchangé : le `knip.json` existant est accepté tel quel par knip 6
(vérifié — knip 6 rejette les clés inconnues, donc l'absence d'erreur vaut validation).

Il n'existe **pas** de mécanisme de baseline natif dans knip 6.32.2 : `--save-baseline` et
`--baseline` (mentionnés par certains articles) ne sont pas des options de knip — `yarn knip
--save-baseline` répond `Unknown option`. D'où ce fichier, qui tient lieu de baseline.

### Ce que la panne a coûté

Sur la PR 5192, la suppression de 48 fichiers legacy a laissé 6 fichiers orphelins
(`ui/components/InfoTooltipOrModal.tsx`, `ui/components/index.ts`, `ui/components/ErrorMessage/*`,
`ResultListsLoading.tsx`, `rechercheCDDCDI.tsx`) et la dépendance `mersenne-twister` derrière elle,
détectés à la main. Vérification faite sur le commit `23457dcc1` (avant que le nettoyage
n'atterrisse) : **les 6 fichiers et `mersenne-twister` figuraient tous dans la sortie de knip 6**.
La détection manuelle était intégralement reproductible par l'outil.

## Corrections de configuration appliquées au passage

knip 6 a fait apparaître des dégâts de configuration qui produisaient des findings faux. Chaque
correctif ci-dessous a été mesuré isolément, en diffant la sortie complète avec et sans.

| Symptôme | Cause | Correctif | Effet mesuré |
| --- | --- | --- | --- |
| hint `src/dev.ts  server  Refine entry pattern (no matches)` | entry pointant sur un fichier supprimé ; le vrai point d'entrée (`src/index.ts`, cf. `tsup.config.ts` et `server/package.json#scripts.cli`) n'était pas déclaré, ni le `globalSetup` vitest | `entry: ["src/index.ts!", "src/migrations/*.ts!", "tests/utils/globalSetup.ts"]` | −2 faux « unused files » (`server/src/index.ts`, `server/tests/utils/globalSetup.ts`), −1 faux « unused export » (`initSentry`), hint levé |
| 15 fausses « unlisted dependencies » (`@yarnpkg/core`, `clipanion`, `semver`…) | knip lit les plugins Yarn déclarés dans `.yarnrc.yml` et analyse les bundles `.yarn/plugins/*.cjs` | `".": { "ignore": [".yarn/**"] }` | unlisted 28 → 13 |
| hints `.scss` / `.sass  ui  Compiled extension excluded by project` | les patterns `project` de `ui` ne couvraient que `ts,tsx` | `project: ["./**/*.{ts,tsx,scss,sass}", …]` | 2 hints levés |

Total : 459 → **441 findings**, et **3 → 0 configuration hints**.

Les suffixes `!` (fichiers de production) sont conservés : `yarn knip -p` reste utilisable pour
l'analyse en mode production stricte.

> Piste écartée : ajouter `**/*.test.ts` à l'`entry` de `server` (l'`entry` explicite écrase les
> patterns par défaut de knip, qui incluent les fichiers de test). Mesuré sur cette base : sortie
> **strictement identique**, donc no-op — non retenu.

## Baseline sur `main` (knip 6.32.2)

432 findings, `exit 1`. Répartition :

| Catégorie | Total | `server` | `shared` | `ui` | racine |
| --- | --- | --- | --- | --- | --- |
| Unused files | 13 | 4 | 0 | 9 | 0 |
| Unused dependencies | 6 | 3 | 2 | 1 | 0 |
| Unused devDependencies | 13 | 2 | 0 | 2 | 9 |
| Unlisted dependencies | 13 | 1 | 1 | 11 | 0 |
| Unlisted binaries | 7 | 1 | 0 | 0 | 6 |
| Unresolved imports | 3 | 0 | 0 | 0 | 3 |
| Unused exports | 248 | 118 | 97 | 33 | 0 |
| Unused exported types | 116 | 32 | 77 | 7 | 0 |
| Unused exported enum members | 8 | 0 | 8 | 0 | 0 |
| Duplicate exports | 5 | 2 | 1 | 2 | 0 |

### Unused files (13)

`ui/app/_components/FormComponents/AutocompleteAsync.tsx` et `InputFormField.tsx` (atteignable
uniquement via lui) ont été supprimés depuis, avec leurs 3 dépendances mortes par ricochet
(`@uidotdev/usehooks`, `autosuggest-highlight`, `@types/autosuggest-highlight`).

- `server/src/common/utils/log-message.ts`
- `server/src/jobs/domaines-metiers/domaine-metiers-fix-romes.ts`
- `server/src/jobs/one-time-job/resync-lba-jobs-partners-stats.ts`
- `server/src/services/ftjob.service.ts`
- `ui/app/_components/ClientOnly.tsx`
- `ui/app/_components/FormComponents/SelectFormField.tsx`
- `ui/app/(espace-pro)/_components/ConnectionActions.tsx`
- `ui/app/(espace-pro)/_components/promoRessources.tsx`
- `ui/app/(home)/_components/AmeliorerLBA.tsx`
- `ui/components/ItemDetail/DidYouKnow.tsx`
- `ui/components/MailCard.tsx`
- `ui/services/fetch-lba-company-details.ts`
- `ui/utils/get-item-id.ts`

### Unused dependencies (6) et devDependencies (13)

Les findings ont été vérifiés un par un au `grep` sur les sources (22 à l'origine ; les 3 « mortes
par ricochet » de `AutocompleteAsync.tsx` ont été supprimées avec lui, cf. ci-dessus). Classement :

**Réellement mortes — supprimables** (12) : aucune occurrence hors `package.json`.
`bunyan`, `memoizee`, `openai` (seule trace : une clé de config `config.openai`, aucun import),
`i18next`, `@mui/x-data-grid`, `cross-env`, `vite-tsconfig-paths`,
`zod-fixture` (remplacé par le shim maison `server/tests/utils/zodFixtureCompat.ts`),
`@testing-library/react` et `@testing-library/dom` (aucun test `ui` ne les importe),
`@semantic-release/changelog` et `@semantic-release/git` (ni l'un ni l'autre n'est dans les
`plugins` de `release.config.js` — attention au faux positif de `grep` sur
`@semantic-release/github`).

**Mal placées** (4) — utilisées, mais déclarées dans le mauvais workspace :
`zod-mongodb-schema` (déclaré dans `shared`, importé dans
`server/src/common/utils/mongodb-utils.ts`), `stream-json`, `type-fest`, `dotenv` (déclarés à la
racine, utilisés dans `server` / `ui`, qui déclarent d'ailleurs leur propre `dotenv`).

**Faux positifs** (3) :
- `gitleaks-secret-scanner` — appelé par `yarn run gitleaks-secret-scanner` depuis
  `.bin/scripts/gitleaks-check.sh` ; knip n'analyse pas les scripts shell.
- `sharp` — backend d'optimisation d'images de Next en production ; `next/image` est importé dans
  68 fichiers `ui`. Aucune référence directe dans les sources, donc invisible pour knip : ne pas
  supprimer sans valider un build de production.
- `nock` — **bug knip 6**. `nock` est importé dans 32 fichiers `server`. Vérifié : même en ajoutant
  `import nock from "nock"` en tête de `server/src/index.ts` (fichier entry), knip continue de le
  déclarer non utilisé. Non reproductible sur un projet isolé (`package.json` + `index.ts`
  important `nock`, `zod-fixture` et `picocolors`, mêmes `node_modules`, avec et sans
  `tsconfig.json` en `moduleResolution: bundler`) → le faux positif est spécifique au monorepo,
  cause non élucidée. À remonter en amont.

À noter également : `sass` est déclaré dans `ui/devDependencies` alors qu'il ne reste **aucun**
fichier `.scss` dans le repo. knip ne le signale pas (son plugin `sass` le considère utilisé
implicitement) — candidat à la suppression, à confirmer côté build Next.

### Unlisted dependencies (13)

- `dayjs` — `server/src/global.d.ts` l'importe sans que `server` ne le déclare. À déclarer.
- `notion-types` × 5 (pages éditoriales `ui`) — transitive de `notion-client` / `react-notion-x`
  (tous deux déclarés dans `ui/package.json`), importée directement pour ses types. À déclarer.
- `job-processor/dist/core.js` × 1 et `job-processor/dist/react` × 6 — imports profonds dans un
  paquet déclaré, non couverts par sa `exports` map. Soit passer par un sous-chemin exporté, soit
  ajouter à `ignoreDependencies`.

### Unlisted binaries (7)

- `mna` × 6 (`package.json` + 5 workflows) — script local `.bin/mna`, que knip ne modélise pas.
  Faux positif ; candidat à `ignoreBinaries`.
- `dotenv` × 1 (`server/package.json`, script `seed:reference`) — **finding réel** : le paquet
  `dotenv` ne fournit pas de binaire `dotenv` (c'est `dotenv-cli`). `yarn workspace server
  seed:reference` est donc cassé.

### Unresolved imports (3)

```
./tests/utils/setup.ts        vitest.config.ts
./tests/utils/globalSetup.ts  vitest.config.ts
./tests/setup.ts              vitest.config.ts
```

Limitation knip : dans un `vitest.config.ts` utilisant `test.projects`, knip résout `setupFiles` /
`globalSetup` par rapport au fichier de config (la racine) au lieu du `root` de chaque projet
(`./server`, `./ui`). Les 3 chemins sont corrects côté vitest. Faux positifs.

### Unused exports (248), types (116), enum members (8), duplicate exports (5)

Backlog à traiter par workspace, hors périmètre de ce correctif. Deux remarques :

- `shared` est configuré avec `includeEntryExports: true` et tous ses fichiers en `entry` : ses 97
  exports + 77 types signalés sont des exports d'un paquet interne consommés par personne — c'est
  le comportement voulu, pas un artefact.
- Les 5 `duplicate exports` sont des fichiers qui exportent la même valeur en nommé **et** en
  `default` — correction mécanique.

Liste complète : `yarn knip --exports`.

## Ajout en CI — évaluation

Le job `tests` de `.github/workflows/ci.yml` fait `typecheck` + `biome ci` + `vitest`. Aucun des
trois ne voit un fichier non importé ni une dépendance orpheline : c'est bien un angle mort.

**En l'état, `yarn knip` ne peut pas être ajouté en gate bloquant** : 432 findings, `exit 1`
immédiat. Et knip 6 n'a pas de baseline native (cf. plus haut), donc pas de moyen de ne faire
échouer que sur les *nouveaux* findings sans écrire un script maison.

Trois options, par ordre de préférence :

1. **Nettoyer puis brancher (recommandé).** Le volume actionnable est faible : 12 dépendances
   réellement mortes (1 PR), 13 fichiers orphelins (1 PR), 4 dépendances à déplacer et 6 à
   déclarer (1 PR) — les 3 dépendances mortes par ricochet et 2 des fichiers ont déjà été
   supprimés. Restent les ~370 exports/types, à traiter par workspace. Une fois à zéro, le step
   ci-dessous devient un gate honnête.

2. **Brancher tout de suite mais scopé aux catégories nettoyées au fur et à mesure**, en
   élargissant `--include` PR après PR. Premier palier possible dès que les fichiers orphelins et
   les dépendances mortes sont traités :

   ```yaml
         - name: dead code & unused dependencies
           run: yarn knip --include files,dependencies,unlisted,binaries --treat-config-hints-as-errors
   ```

   `--treat-config-hints-as-errors` est important : sans lui, une config qui pourrit (entry
   pointant sur un fichier supprimé, comme `src/dev.ts` ci-dessus) dégrade silencieusement
   l'analyse sans faire échouer le job.

3. **Ne pas brancher.** À écarter : c'est l'état actuel, et il a déjà coûté une détection manuelle
   sur la PR 5192.

Ce qu'il ne faut **pas** faire : ajouter le step avec `--no-exit-code`. Un job vert qui affiche des
warnings est indiscernable d'un job vert propre, et personne ne lira la sortie.

Le coût est négligeable : knip 6 s'appuie sur `oxc` et non plus sur le compilateur TypeScript —
827 ms, sans service à démarrer. Le step se place naturellement après `lint & format`, avant le
démarrage de MongoDB.
