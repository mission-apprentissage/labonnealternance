<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Surface MUI (issue #5188)

MUI (material + system + utils + Emotion + Popper) pèse ~99 ko gzip sur le first-load des pages
publiques. C'est structurel — `MuiDsfrThemeProvider` (react-dsfr) est la colle du design system —
mais la surface ne doit pas grossir. Règles :

- **Pages publiques** (tout ce qui n'est pas sous `app/(espace-pro)`) : seuls les imports de
  `@mui/material` (core) sont autorisés. Aucun module de l'écosystème étendu :
  `@mui/x-data-grid`, `@mui/x-date-pickers`, `@mui/x-charts`, `@mui/icons-material`, `@mui/lab`…
- **`@mui/x-data-grid`** n'est jamais importé directement dans ce repo : c'est une peer dependency
  de `job-processor`, dont le composant React n'est monté que sur la page admin
  `espace-pro/administration/processeur`. Ne pas l'importer ailleurs ; s'il faut un tableau côté
  public, utiliser le composant Table du DSFR ou un tableau maison.
- **Garde-fou CI** : `perf-budget.json` → `forbiddenOnFirstLoad` interdit `@mui/x-data-grid` et
  `job-processor` sur le first-load de `/` et `/recherche` (vérifié par analyse des sourcemaps
  dans `scripts/perf-budget.mjs`, workflow `perf_budget.yml`). Si un nouveau module lourd entre
  dans le projet pour l'espace pro, l'ajouter à cette liste.
- **Imports barrel OK** : `import { Box } from "@mui/material"` est déjà tree-shaké par Next
  (`@mui/material` est dans la liste par défaut d'`optimizePackageImports`). Ne pas réécrire les
  imports en chemins profonds (`@mui/material/Box`), ça n'apporte rien au bundle de prod.

## optimizePackageImports : rien à ajouter (testé 2026-08, issue #5188)

Ne pas ajouter d'entrée à `experimental.optimizePackageImports` sans nouvelle mesure. Inventaire
des barrels du code ui et résultat :

- `@mui/material` (~350 imports) et `lodash-es` : déjà dans la liste par défaut de Next.
- `@codegouvfr/react-dsfr` (263 imports racine) : faux barrel — le root du package pointe sur
  `fr/index.js` (le helper de tokens `fr`, seul export consommé) ; les composants sont déjà
  importés en subpath (`…/Button`). Rien à optimiser.
- `shared` (115 imports barrel d'un vrai `export *`) : testé en ajoutant
  `optimizePackageImports: ["shared"]` puis build de prod — mesures du perf-budget strictement
  identiques (425,3 / 63,5 / 591,5 / 2398,3 ko, mêmes décomptes de sources). Le tree-shaking de
  Turbopack couvre déjà ce cas (ou l'option est inerte sur un package workspace transpilé) :
  aucun gain, l'option n'a pas été gardée.

## Pigment CSS : piste écartée (évaluée 2026-08, issue #5188)

`@pigment-css/react` (CSS-in-JS zéro-runtime de MUI) permettrait en théorie de supprimer le
runtime Emotion du first-load. Conclusion : **non viable actuellement**, à ne pas relancer sans
changement chez MUI ou react-dsfr.

1. Le projet est **en pause chez MUI** : toujours en alpha, développement gelé sans timeline
   (https://github.com/mui/pigment-css/discussions/249, https://mui.com/blog/2026-and-beyond/).
2. `MuiDsfrThemeProvider` de react-dsfr repose sur le thème runtime Emotion de `@mui/material` ;
   basculer sur `@mui/material-pigment-css` casserait l'intégration DSFR↔MUI sans support amont.

Réévaluer seulement si MUI relance le projet (ou équivalent zéro-runtime) **et** que react-dsfr
le supporte.

# Contenu éditorial Notion : cache et rate-limit (issue Sentry LBA-UI-5CVZZZZZZG4TR)

Les pages `app/(editorial-with-notion)/**` lisent Notion via `services/fetch-notion-page.ts`
(API v3 non officielle, sans authentification, rate-limitée par IP).

Piège : `cacheMaxMemorySize: 0` dans `next.config.mjs` rend le cache handler `"use cache"` **no-op
en production** (`createDefaultCacheHandler(0)` renvoie un handler vide ; en `next dev` Next force
une taille mémoire, donc le bug ne se reproduit pas en dev). Le `cacheLife("days")` du service ne
cachait donc rien : chaque requête sur /faq, /cgu, /politique-de-confidentialite… retapait Notion,
d'où des 429 en rafale. `fetch-notion-page.ts` porte son propre cache process + retry +
stale-if-error, indépendant du cache handler Next.

`fetch-notion-page.ts` est le seul `"use cache"` serveur du projet — les autres sont
`"use cache: private"`, non concernés par `cacheMaxMemorySize`.

## Reproduire en local

Le bug n'apparaît qu'en build de production :

```bash
node ui/scripts/notion-api-stub.mjs &           # bouchon Notion sur :4545, compte les appels
export NOTION_API_BASE_URL=http://localhost:4545/api/v3
yarn workspace shared run build && yarn workspace ui build
NEXT_PUBLIC_ENV=local NEXT_PUBLIC_VERSION=0.0.0-local npx next start -p 3100

curl -s "localhost:4545/__reset?mode=normal"    # modes: normal | 429 | flaky | sync429 | degraded
for i in 1 2 3 4 5; do curl -s -o /dev/null localhost:3100/faq; done
curl -s localhost:4545/__stats                  # appels réellement envoyés à Notion
```

Mesures (5 requêtes, instance fraîche) :

| Scénario | /conditions-generales-utilisation | /faq |
| --- | --- | --- |
| avant (cache no-op) | 5 appels | 40 appels |
| après | 1 appel | 8 appels |

Sous `mode=flaky` (429 puis OK) la page rendait vide avant le correctif, elle rend le contenu après.
