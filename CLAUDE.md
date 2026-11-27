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
- `ui/AGENTS.md` porte les règles propres à `ui/`, pour Claude (via `ui/CLAUDE.md`) comme pour Copilot. `next dev` réécrit son bloc `nextjs-agent-rules` : ne pas le modifier ; le reste se maintient à la main.
- PR : titre `type: sujet (#XXX)` où `XXX` est le numéro de l'issue, suffixe omis quand il n'y a pas d'issue liée ; description qui commence par `Closes #XXX`. Le tout via le skill `pull-request-lba`. Le check de titre n'accepte que `fix`, `feat`, `refactor`, `chore` et `docs`, avec un scope optionnel qui désigne un workspace (`chore(ui): …`) et jamais l'issue (`.github/pr-title-checker-config.json`).
- `_temp/` est ignoré par git : notes de passation et plans de travail.

## Commentaires

- Par défaut, pas de commentaire. N'en écrire un que pour ce que le code ne peut pas dire : une décision et sa raison, une contrainte externe (limite d'un outil, comportement d'une API), une règle métier non évidente, un comportement volontairement contre-intuitif.
- Décrire le code tel qu'il est, pas son historique : pas de « ne … plus », « avant », « désormais », ni de récit de debug. L'historique va dans le commit ou la PR.
- Chaque explication à un seul endroit, les autres y renvoient en une ligne (`cf. buildSortStage`).
- Viser 1 à 3 lignes. Un bloc plus long doit apporter une information introuvable ailleurs.
- Ne citer que des références stables : numéro d'issue ou de PR, nom de symbole. Pas de jalon interne (« recette #3 »).
- Quand on renomme, déplace ou supprime un symbole, cf. « Documentation ».

## Documentation

- Le code fait foi. Quand un commentaire, un fichier de `docs/` ou ces instructions contredisent le code, suivre le code et corriger le texte dans la même PR, ou signaler l'écart s'il sort du périmètre.
- Avant de renommer, déplacer ou supprimer un fichier ou un symbole, `git grep` son nom dans `docs/`, les commentaires et les fichiers d'instructions (`CLAUDE.md`, `ui/AGENTS.md`, `.github/copilot-instructions.md`), puis mettre à jour chaque mention.
- `docs/` ne contient que de la référence à jour : comportement actuel, procédures. Les analyses ponctuelles, expériences et plans terminés vont dans l'issue, la PR ou Notion.

## Hooks de vérification

- `.claude/hooks/`, câblés par `.claude/settings.json` : lint Biome du fichier à chaque `Edit`/`Write` ; en fin de tour, `biome check --write` sur les fichiers modifiés, `biome ci .`, `tsc -b` puis `vitest related`. Un rouge renvoie la session au travail, trois fois par cycle au plus. Corriger le code, jamais un test sain ; une erreur antérieure à la session se signale au lieu de se corriger.
- Un message `INFORMATION` (Mongo injoignable, isolation des bases absente, `node_modules` périmé, autre Node) ne demande aucune correction : le rapporter dans la réponse finale.
- `LBA_HOOKS=off` désactive tout, `LBA_HOOKS_STRICT=1` rend les dégradations bloquantes. État d'un worktree : `node .claude/hooks/cli.mjs status [--all] [--strict]` (0 vert, 3 dégradé avec `--strict`, 4 rouge, 5 non vérifié, 6 hooks absents), dernier verdict dans `<git-dir>/lba-hooks/last-run.json`. Tests : projet Vitest `hooks`.

## Pièges connus

- **`yarn cli` exécute `server/dist`**, pas les sources. Après une modification de `shared` ou d'un modèle : `yarn workspace shared build` puis `yarn workspace server build`.
- **Validateur de schéma MongoDB** : `error` hors production, `warn` en production (`configureDbSchemaValidation`). Un champ requis ajouté à un modèle casse toute mise à jour partielle en recette tant que le backfill n'est pas passé : l'ajouter en optionnel d'abord. Les migrations qui réécrivent des documents passent `bypassDocumentValidation: true`.
- **Crons job-processor** : pas de `concurrency: { mode: "exclusive" }` sur un cron fréquent, un créneau sur deux est perdu (cf. `server/src/jobs/jobs.ts`).
- **`sanitizeTextField(null)` renvoie `""`**, ce qui neutralise tout `??` en aval. Utiliser `||`, ou `sanitizeNullableTextField` (`format-text-fields-jobs-partners.ts`) pour garder `null`.
- **mongot / `$search`** : `exists` matche aussi les champs à `null`, passer par un `range`. Les limites de requête (`maxClauseCount`) et le retry sur annulation transitoire sont documentés dans `server/src/services/search/`. Docs : `docs/mongodb/`.
- **`react-notion-x` est patché** (`.yarn/patches/`, RGAA 8.9 : blocs texte en `<p>` ; RGAA 9.3 : puces consécutives dans une seule liste, sous-listes dans le `li`), et `resolutions` le fige sur 7.10.0 : modifier `ui/package.json` ne change pas la version installée. `yarn patch` extrait le paquet non patché : y appliquer d'abord le patch existant (`git apply`). Puis reporter le changement, `yarn patch-commit -s <dossier>`, retirer la clé `react-notion-x@^7.10.0` qu'il ajoute à `resolutions` (ou mettre à jour la clé existante en cas de montée de version), `yarn install`, et lancer `notion-renderer-patch.test.ts`.
- **Worktrees** : `node_modules` absent, ou copie périmée de celui du checkout principal : `yarn install` avant toute vérification (la garde de fin de tour le signale par `deps-stale`). Pour vérifier le format sans installer, lancer `npx @biomejs/biome@<version de package.json> check <fichiers>`, jamais `npx prettier`.
