# La bonne alternance

Plateforme de recherche de formations et d'offres en alternance (site, API publique, widget). Monorepo Yarn :

- `server/` : API Fastify 5, MongoDB (driver 7), jobs et crons via job-processor
- `ui/` : Next.js 16 (App Router), MUI 7 + react-dsfr
- `shared/` : modèles et routes en Zod 4, utilitaires communs (`shared/src/models`, `shared/src/routes`)

Stack : Node ≥ 26, TypeScript 7, Yarn 3, Biome 2 (lint + format, pas de Prettier ni d'ESLint), Vitest, Playwright (`ui/e2e`), Sentry.

Les conventions détaillées (architecture, CI, revue) sont dans `.github/copilot-instructions.md`.

## Commandes

```bash
yarn dev                  # stack complète (services Docker + server + ui)
yarn services:start       # MongoDB, ClamAV, SMTP seuls
yarn setup:mongodb        # initialise le replica set local
yarn typecheck
yarn check:fix            # Biome, avec correction
yarn test <chemin>        # Vitest, MongoDB local requis
yarn cli <commande>       # jobs et migrations (cf. piège du dist ci-dessous)
yarn migration:create -d <nom>
```

Après un bump de dépendances : `yarn install` puis `yarn dedupe --strategy highest` (la CI lance `yarn dedupe --check`).

## Conventions

- Fichiers `.ts` en kebab-case. Composants `.tsx` en PascalCase, sauf les fichiers réservés de Next (`page.tsx`, `layout.tsx`…).
- Zod v4 : validateurs de premier niveau (`z.email()`), `z.codec()` plutôt que `.transform()` pour les schémas bidirectionnels.
- Next : `cacheComponents` actif. Après lecture de `headers()` ou de la session, `"use cache: private"` avec `cacheTag`/`cacheLife`, jamais `"use cache"` seul. Avec `<Activity>`, un composant reste monté au retour arrière : tout `useState(prop)` doit être resynchronisé par un `useEffect`.
- Icônes : DSFR en priorité (`fr-icon-*`). Typage des composants : https://github.com/codegouvfr/react-dsfr/tree/main/src
- `ui/AGENTS.md` et `ui/CLAUDE.md` sont générés par `next dev` : ne pas les modifier.
- PR : titre `type(lba-XXX): sujet`, description qui commence par `Closes #XXX`, via le skill `pull-request-lba`. Le check de titre n'accepte que `fix`, `feat`, `refactor`, `chore` et `docs` (`.github/pr-title-checker-config.json`).
- `_temp/` est ignoré par git : notes de passation et plans de travail.

## Commentaires

- Par défaut, pas de commentaire. N'en écrire un que pour ce que le code ne peut pas dire : une décision et sa raison, une contrainte externe (limite d'un outil, comportement d'une API), une règle métier non évidente, un comportement volontairement contre-intuitif.
- Décrire le code tel qu'il est, pas son historique : pas de « ne … plus », « avant », « désormais », ni de récit de debug. L'historique va dans le commit ou la PR.
- Chaque explication à un seul endroit, les autres y renvoient en une ligne (`cf. buildSortStage`).
- Viser 1 à 3 lignes. Un bloc plus long doit apporter une information introuvable ailleurs.
- Ne citer que des références stables : numéro d'issue ou de PR, nom de symbole. Pas de jalon interne (« recette #3 »).
- Quand on renomme ou déplace un symbole, chercher les commentaires qui le citent.

## Pièges connus

- **`yarn cli` exécute `server/dist`**, pas les sources. Après une modification de `shared` ou d'un modèle : `yarn workspace shared build` puis `yarn workspace server build`.
- **Validateur de schéma MongoDB** : `error` hors production, `warn` en production (`configureDbSchemaValidation`). Un champ requis ajouté à un modèle casse toute mise à jour partielle en recette tant que le backfill n'est pas passé : l'ajouter en optionnel d'abord. Les migrations qui réécrivent des documents passent `bypassDocumentValidation: true`.
- **Crons job-processor** : pas de `concurrency: { mode: "exclusive" }` sur un cron fréquent, un créneau sur deux est perdu (cf. `server/src/jobs/jobs.ts`).
- **`sanitizeTextField(null)` renvoie `""`**, ce qui neutralise tout `??` en aval. Utiliser `||`, ou `sanitizeNullableTextField` (`format-text-fields-jobs-partners.ts`) pour garder `null`.
- **mongot / `$search`** : `exists` matche aussi les champs à `null`, passer par un `range`. Les limites de requête (`maxClauseCount`) et le retry sur annulation transitoire sont documentés dans `server/src/services/search/`. Docs : `docs/mongodb/`.
- **Worktrees** : pas de `node_modules`. Pour vérifier le format sans installer, lancer `npx @biomejs/biome@<version de package.json> check <fichiers>`, jamais `npx prettier`.
