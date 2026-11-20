# Pages SEO « Alternance par secteur » : plan d'implémentation (lot 1)

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** livrer le type de page `/alternance/secteur/<slug>` avec une seule page, `informatique`, et la page d'index `/alternance/secteurs`.

**Architecture :**
- Une nouvelle collection `seo_secteurs` est remplie par une migration rejouable (upsert par slug).
- Ses champs calculés viennent de `updateSeoSecteurs()`, qui réutilise les helpers ROME de `seo.service.ts`. Elle tourne dans un cron quotidien dédié et une fois à la fin de la migration.
- L'UI copie la page métier et n'utilise que des composants existants : DSFR, `CarteOffre`, `SalaireSection`, `SchemaOrg`, `Breadcrumb`, l'`Accordion` DSFR pour la FAQ, et les styles de `hub-styles.ts`.

**Stack :** Fastify 5, MongoDB driver 7, Zod 4 (shared), Next.js 16 App Router avec `cacheComponents`, MUI 7 et react-dsfr, Vitest.

**Spec :** `docs/superpowers/specs/2026-11-16-pages-secteurs-design.md`. Contenu de la page modèle : `_temp/secteurs/informatique.md`.

## Contraintes globales

- Le vocabulaire est celui des étudiants : H1 « Alternance informatique », slug `informatique`, libellés métier repris des requêtes (« Technicien support informatique », pas le libellé ROME).
- Chaque chiffre de marché affiche sa source et sa date. Un chiffre non sourcé ne s'affiche pas : le bloc marché est optionnel (`marche: null`).
- « Offres » exclut `partner_label = RECRUTEURS_LBA`. Les entreprises à contacter forment un compteur à part. Les pages métier, ville et diplôme gardent leurs chiffres actuels.
- Les champs calculés sont optionnels dans le schéma Zod. Le validateur MongoDB est en mode `error` hors production (cf. CLAUDE.md).
- Paramètres UTM : `utm_source=lba&utm_medium=website&utm_campaign=lba_seo-prog-secteurs`.
- Cron : `0 5 * * *`, sans `concurrency: { mode: "exclusive" }`.
- Next : le fetch passe par `"use cache: private"` et `cacheLife("hours")`, parce que `apiGet` lit `headers()`.
- Fichiers `.ts` en kebab-case, composants `.tsx` en PascalCase. Pas de commentaire sauf pour une décision non évidente. Biome, pas de Prettier.
- Le worktree n'a pas de `node_modules` : lancer `yarn install` une fois, en tâche 0.
- Titre de PR : `feat: pages SEO par secteur, lot 1 informatique`. Pas d'issue connue, donc pas de suffixe : demander le numéro à Hugo avant la PR.

## Points de vigilance

1. **Secteur sans offres.** `job_count === 0` ou absent : la page répond en 200 avec `robots: { index: false }`, et les blocs calculés vides (offres, entreprises, villes) sont masqués.
2. **Slug inconnu.** `/alternance/secteur/xyz` renvoie `notFound()` : 404, pas d'erreur 500.
3. **Entreprise algo dans les cartes.** Le bloc « Offres » ne doit jamais afficher une carte `RECRUTEURS_LBA`.
4. **Métier sans page.** Une carte métier sans `metier_slug` pointe vers la recherche préremplie, sans lien cassé vers `/alternance/metier/undefined`.
5. **Migration rejouée.** Rejouer la migration ne crée pas de doublon et n'efface pas les champs calculés.

---

### Tâche 0 : préparer le worktree

- [ ] `yarn install` à la racine du worktree. Résultat attendu : succès.
- [ ] `yarn services:start` puis `yarn setup:mongodb`, si MongoDB local ne tourne pas (requis pour les tests).
- [ ] `yarn typecheck`. Résultat attendu : succès sur `main`. On a ainsi une référence avant toute modification.

### Tâche 1 : modèle `seo_secteurs` et route privée (shared)

**Fichiers :**
- Créer : `shared/src/models/seo-secteur.model.ts`
- Modifier : `shared/src/models/index.ts` (export), `shared/src/models/models.ts` (enregistrement à côté de `seoMetierModel`, l. 84 et 184), `shared/src/routes/_private/seo.routes.ts`

**Interfaces produites :**
- `ZSeoSecteur`, `ISeoSecteur`, `ISeoSecteurMetier`, et `default { zod, indexes: [[{ slug: 1 }, { unique: true }]], collectionName: "seo_secteurs" }`.
- La route `"/_private/seo/secteur/:secteur"` : `GET`, `params: { secteur: z.string() }`, réponse `200: ZSeoSecteur.nullable()`, `securityScheme: null`.

Schéma (`z.strictObject`) :

```ts
// saisis (migration)
slug: z.string(), secteur: z.string(), titre: z.string(), accroche: z.string(), meta_description: z.string(),
q_recherche: z.string(),
description: z.array(z.string()),
metiers: z.array(z.object({ libelle: z.string(), romes: z.array(z.string()), description: z.string(), niveau_acces: z.string(), metier_slug: z.string().nullable() })),
marche: z.object({ projets_recrutement: z.number(), part_difficiles: z.number(), annee: z.number(), source_libelle: z.string(), source_url: z.string(), interpretation: z.string() }).nullable(),
formations_niveaux: z.array(z.object({ niveau: ZFormationsNiveaux /* réutiliser l'enum SEO_METIER_FORMATION_NIVEAUX */, diplomes: z.string(), diplome_slug: z.string().nullable() })),
faq: z.array(z.object({ question: z.string(), reponse: z.string() })),
romes: z.array(z.string()),
// calculés (cron), optionnels
job_count: z.number().optional(), company_count: z.number().optional(), algo_company_count: z.number().optional(), applicant_count: z.number().optional(),
metiers_counts: z.array(z.object({ libelle: z.string(), job_count: z.number() })).optional(),
entreprises: z.array(ZSeoMetierEntreprise).optional(), villes: z.array(ZSeoMetierVille).optional(),
formations: z.array(ZSeoMetierFormation).optional(), cards: z.array(ZSeoJobCard).optional(),
created_at: z.date(), updated_at: z.date(), _id: zObjectId,
```

Exporter depuis `seo-metier.model.ts` les sous-schémas réutilisés (`ZSeoMetierEntreprise`, `ZSeoMetierVille`, `ZSeoMetierFormation`, `ZFormationsNiveaux`). Ce sont aujourd'hui des `const` non exportés.

- [ ] Écrire le modèle, l'enregistrer, ajouter la route.
- [ ] `yarn workspace shared build && yarn typecheck`. Résultat attendu : succès.
- [ ] Commit : `feat(shared): modèle seo_secteurs et route privée`

### Tâche 2 : calcul `updateSeoSecteurs` (server)

**Fichiers :**
- Modifier : `server/src/services/seo.service.ts`
- Tester : `server/src/services/seo-secteur.service.test.ts` (test colocalisé, comme `application.service.test.ts`)

**Interfaces :**
- Consomme : `seoSecteurModel` (tâche 1).
- Produit : `getSeoSecteur({ secteur }: { secteur: string }): Promise<ISeoSecteur | null>` et `updateSeoSecteurs(): Promise<void>`, exportées.

Changements de helpers. La valeur par défaut garde le comportement actuel pour les pages métier, ville et diplôme :
- `getJobCountForMetier(romes, { includeAlgo = true } = {})` : si `false`, ajoute `partner_label: { $ne: RECRUTEURS_LBA }`.
- Même option pour `getTopCompaniesForMetier` et `getTopCitiesForMetier`. `getCompanyCountForMetier` exclut déjà les algo : on n'y touche pas.
- Nouveau : `getAlgoCompanyCountForRomes(romes: string[]): Promise<number>`, qui compte les SIRET distincts des `jobs_partners` actifs avec `partner_label = RECRUTEURS_LBA` sur ces codes ROME.
- Nouveau : `getOfferCardsForRomes(romes: string[]): Promise<ISeoJobCard[]>`. Ce sont les 6 premières cartes de `getJobCards` sans les `RECRUTEURS_LBA`. On extrait de `getJobCards` une variante qui saute l'appel `lbaCompanies`. On ne duplique pas le calcul des candidatures.

`updateSeoSecteurs()` :
- boucle sur tous les documents de `seo_secteurs` ;
- pour chacun, calcule les compteurs avec `includeAlgo: false`, `algo_company_count`, `applicant_count`, `metiers_counts` (le nombre d'offres hors algo de chaque `metiers[i].romes`), `entreprises`, `villes`, `formations` et `cards` ;
- fait un `$set` avec `updated_at` ;
- protège chaque secteur par un `try/catch` qui journalise (`logger.error`), comme `updateSeoMetierJobCounts`.

- [ ] **Écrire les tests en échec** (`useMongo()` ; offres créées par `generateJobsPartnersOfferPrivate` de `shared/src/fixtures/job-partners.fixture.ts`) :
  - `it("compte les offres sans les entreprises à contacter")` : 2 offres actives sur `M1805` (un partenaire, une `OFFRES_EMPLOI_LBA`) et 3 `RECRUTEURS_LBA` actives sur `M1805` avec des SIRET distincts. Attendus : `job_count === 2` et `algo_company_count === 3`.
  - `it("n'inclut aucune entreprise à contacter dans les cartes")` : même jeu. Attendu : `cards.every(c => c.partner_label !== JOBPARTNERS_LABEL.RECRUTEURS_LBA)` et `cards.length <= 6`.
  - `it("compte les offres par métier")` : métiers `[{romes:["M1805"]}, {romes:["I1401"]}]` et 2 offres `M1805`. Attendu : `metiers_counts` égal à `[{libelle:…, job_count:2}, {libelle:…, job_count:0}]`.
  - `it("ignore les offres inactives")` : une offre `offer_status` non active ne compte pas.
  - `it("ne change pas le compteur des pages métier")` : `getJobCountForMetier(["M1805"])` sans option compte toujours les `RECRUTEURS_LBA`. On teste via `updateSeoMetierJobCounts` sur un `seo_metiers` minimal : `job_count === 5`.
- [ ] `yarn test server/src/services/seo-secteur.service.test.ts`. Résultat attendu : FAIL, `updateSeoSecteurs` n'existe pas.
- [ ] Implémenter.
- [ ] Relancer. Résultat attendu : PASS.
- [ ] Commit : `feat(server): calcul des données des pages secteur`

### Tâche 3 : contrôleur et cron quotidien (server)

**Fichiers :**
- Modifier : `server/src/http/controllers/_private/seo.private.controller.ts` (handler `"/_private/seo/secteur/:secteur"` → `getSeoSecteur`, sur le modèle du handler métier)
- Modifier : `server/src/jobs/jobs.ts`, à côté de l'entrée `"Mise à jour des données calculées pour les pages SEO"` (l. 442)

Le nouveau cron s'appelle `"Mise à jour des données calculées pour les pages SEO secteur"`, avec `cron_string: "0 5 * * *"` et `handler: updateSeoSecteurs`.

- [ ] Implémenter.
- [ ] `yarn typecheck`. Résultat attendu : succès.
- [ ] Commit : `feat(server): route et cron quotidien des pages secteur`

### Tâche 4 : migration du lot 1 (informatique)

**Fichiers :**
- Créer : `server/src/migrations/20261116120000-seo-secteurs-lot1.ts`
- Tester : `server/tests/integration/migrations/seo-secteurs-lot1.test.ts`. Le test doit vivre sous `tests/`, pas à côté de la migration : cf. le commentaire de `seo-diplomes-lot1-5539.test.ts`.

**Interfaces :**
- Produit : `export const secteursData`, plus `up()` et `requireShutdown = false`.

Fonctionnement :
- un `updateOne` par slug, avec `$set` sur les champs saisis plus `romes` (union dédupliquée des `metiers[].romes`) et `updated_at` ;
- `$setOnInsert` sur `_id` et `created_at` uniquement : les champs calculés restent absents jusqu'au calcul ;
- `upsert: true` ;
- à la fin, appel à `updateSeoSecteurs()`, comme la migration diplôme.

Contenu : celui de `_temp/secteurs/informatique.md`, avec trois réserves.
- **Codes ROME** : à vérifier un par un sur la fiche ROME de France Travail (référentiel v4) avant de les écrire. Retirer la mention `[À VÉRIFIER]`.
- **`marche: null`** tant que les chiffres BMO 2026 ne sont pas sourcés. La section 3 affiche alors seulement le compteur LBA.
- **`diplome_slug`** : `"bac-pro-ciel"` pour le niveau 4, car la page existe déjà dans `diplome_data`. Pour les autres niveaux, `null` sauf si `diplome_data.tsx` contient la page.
- `metier_slug` vaut `developpeur-web`, `developpeur-cybersecurite` et `data-analyst` pour les métiers concernés, `null` pour les autres.
- `q_recherche` vaut `"informatique"`.

- [ ] **Écrire le test en échec** :
  - `it("crée la page informatique")` : après `up()`, `findOne({slug:"informatique"})` existe, `romes` contient `"M1805"`, sans doublon.
  - `it("est rejouable sans doublon et garde les champs calculés")` : poser `job_count: 42` à la main, rejouer `up()`. Attendus : `countDocuments({slug:"informatique"}) === 1`. `job_count` vaut ensuite la valeur recalculée, pas `undefined`.
  - `it("chaque metier_slug renvoie à une page métier existante")` : `secteursData.flatMap(s => s.metiers).filter(m => m.metier_slug)` est inclus dans la liste des slugs de `server/src/jobs/seo/data-metier-seo.ts` complétée des pages créées par migration. À défaut, comparer à une liste en dur : `developpeur-web`, `developpeur-cybersecurite`, `data-analyst`.
- [ ] `yarn test server/tests/integration/migrations/seo-secteurs-lot1.test.ts`. Résultat attendu : FAIL.
- [ ] Implémenter.
- [ ] Relancer. Résultat attendu : PASS.
- [ ] Commit : `feat(server): migration seo-secteurs lot 1 (informatique)`

### Tâche 5 : page `/alternance/secteur/[secteur]` (ui)

**Fichiers :**
- Créer : `ui/app/(editorial)/alternance/secteur/[secteur]/page.tsx`
- Créer : `ui/app/(editorial)/alternance/secteur/[secteur]/_components/` avec un composant par section non triviale : `MetiersSecteurSection.tsx`, `MarcheSecteurSection.tsx`, `CandidatureSpontaneeSection.tsx`, `FormationsSecteurSection.tsx`, `FaqSecteurSection.tsx`
- Modifier : `ui/app/(editorial)/alternance/_components/JobsCtaTracked.tsx` (`SearchOrigin` reçoit `"page_secteur"`), `ui/utils/routes.utils.ts` (`PAGES.dynamic.seoSecteur(slug, label?)`, chemin `/alternance/secteur/${slug}`)

**Interfaces :**
- Consomme : `apiGet("/_private/seo/secteur/:secteur", { params: { secteur } })`, qui renvoie `ISeoSecteur | null`.

**Règle UI : aucun nouveau style de base.** On reprend les objets `boxCss`, `cardSx`, `hrSx` et `threeColGridSx` de la page métier. Si plus de 2 fichiers en ont besoin, on les déplace dans `hub-styles.ts` plutôt que de les copier. On reprend aussi les icônes `/images/seo/*.svg` déjà présentes. Les sections suivent l'ordre du § 5 de la spec.

Correspondances :

| Section | Composant existant |
|---|---|
| En-tête et 4 chiffres | bloc hero de la page métier (`HomeCircleImageDecoration`, grille `statItems`) |
| Description | même rendu que « Le métier de… » (paragraphes en `Typography`, sans `dangerouslySetInnerHTML`) |
| Métiers | grille `threeColGridSx` + `cardSx`. Lien : `PAGES.dynamic.seoMetier(metier_slug)` si `metier_slug`, sinon `buildSearchUrl({ mode: "emplois", q: libelle, radius: 30, page: 0, hitsPerPage: 20 })` + UTM. Nombre d'offres pris dans `metiers_counts` par `libelle`. |
| Marché | si `marche` : chiffres avec la mention `Source : {source_libelle} ({annee})` en lien vers `source_url`. Toujours affiché : « {job_count} offres sur La bonne alternance aujourd'hui ». |
| Offres | `CarteOffre` + `JobsCtaTracked`, avec `buildSearchUrl({ mode: "emplois", q: q_recherche, is_algo_company: [false], … })`. Libellé : « Voir les offres en {secteur} ». |
| Candidatures spontanées | texte + `JobsCtaTracked`, avec `is_algo_company: [true]` |
| Entreprises | bloc entreprises de la page métier |
| Formations | grille de la page métier. Diplômes de `formations_niveaux` avec lien `PAGES.dynamic.seoDiplome(diplome_slug)` si présent, compteur pris dans `formations` par `niveau` |
| Salaire | `<SalaireSection utmParams titre />` |
| Villes | bloc villes de la page métier, avec `findVilleLandingSlug` |
| FAQ | `Accordion` de `@codegouvfr/react-dsfr/Accordion`, comme `alternance/metiers/page.tsx`, plus `<SchemaOrg type="FAQPage" faqItems=… omitBreadcrumb />` |
| Autres secteurs | liens issus de `secteurData` (tâche 6), sauf le secteur courant |

Métadonnées (`generateMetadata`) :
- title : `Alternance ${secteur} : ${job_count} offres et ${company_count} entreprises qui recrutent | La bonne alternance` ;
- description : `meta_description` ;
- `robots: { index: false }` si `!job_count`.

Données structurées : `WebPage`, `ItemList` (`buildOffresItemList(cards)` si `cards` n'est pas vide) et `FAQPage`. Fil d'Ariane : `[PAGES.static.alternanceSecteurs, PAGES.dynamic.seoSecteur(slug, "Informatique")]`.

- [ ] Implémenter.
- [ ] `yarn typecheck` et `npx @biomejs/biome@<version de package.json> check ui/app/(editorial)/alternance/secteur`. Résultat attendu : succès.
- [ ] Commit : `feat(ui): page SEO secteur`

### Tâche 6 : index `/alternance/secteurs`, sitemap et llms.txt (ui)

**Fichiers :**
- Créer : `ui/app/(editorial)/alternance/_components/secteur_data.ts`, avec `export const secteurData = [{ secteur: "Informatique", slug: "informatique" }]`
- Créer : `ui/app/(editorial)/alternance/secteurs/page.tsx`. C'est la version courte de `alternance/metiers/page.tsx` : hero, grille de cartes `listicleCardSx` vers chaque secteur, `SchemaOrg` `CollectionPage` + `ItemList`.
- Modifier :
  - `ui/utils/routes.utils.ts` : `PAGES.static.alternanceSecteurs`, avec le chemin `/alternance/secteurs`, le titre « Secteurs en alternance » et `index: true` ;
  - `ui/utils/routes.metadata.utils.ts` : `alternanceSecteurs()`, avec title et description ;
  - `ui/services/generate-main-sitemap.ts` : un groupe « L'alternance par secteur », qui couvre l'index et `secteurData` sur le modèle du groupe ville (l. 187) ;
  - `ui/app/(editorial)/alternance/metiers/page.tsx` : un lien vers `/alternance/secteurs`, dans un bloc existant de type « aller plus loin » (`AllerPlusLoinItem`).

- [ ] Implémenter.
- [ ] Vérifier que les tests existants du sitemap ou de llms.txt passent, s'il y en a : `yarn test ui/services`.
- [ ] Commit : `feat(ui): index des secteurs et référencement dans le sitemap`

### Tâche 7 : vérification de bout en bout

- [ ] `yarn build` de `shared` et de `server`, puis `yarn cli migrations:up` en local. Résultat attendu : le log `seo-secteurs-lot1` apparaît et `updateSeoSecteurs` se termine sans erreur.
- [ ] Lancer `yarn dev` (ou `preview_start`) et ouvrir `/alternance/secteur/informatique`. Vérifier :
  - toutes les sections sont présentes et dans l'ordre ;
  - aucune carte d'offre n'est une entreprise algo ;
  - les liens des métiers mènent vers des pages qui existent ;
  - la FAQ s'ouvre ;
  - la console n'affiche aucune erreur.
- [ ] Ouvrir `/alternance/secteur/inconnu`. Résultat attendu : 404.
- [ ] Vider `job_count` en base locale et recharger. Résultat attendu : `<meta name="robots" content="noindex">` et blocs vides masqués.
- [ ] Ouvrir `/alternance/secteurs` et `/sitemap-main.xml`. Résultat attendu : les deux URL sont présentes.
- [ ] Vérifier en largeur mobile (375 px) et prendre une capture.
- [ ] `yarn typecheck`, `yarn check:fix`, puis les tests des tâches 2 et 4.
