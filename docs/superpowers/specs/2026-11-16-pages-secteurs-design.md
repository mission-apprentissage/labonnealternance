# Pages SEO programmatiques « Alternance par secteur »

Date : 16 novembre 2026
Statut : validé par Hugo le 16 novembre 2026

**Découpage validé :**
- Lot 1 : le code et la seule page `informatique`.
- Lots suivants : une migration de contenu par lot de secteurs, rédigée par Claude et relue par Hugo.
- La page RH coexiste avec `/metiers/ressources-humaines`. On décidera d'une redirection d'après la GSC.
- Le lien des pages métier vers leur secteur est reporté à un lot suivant.
- UI : uniquement des composants existants du site, pour rester cohérent.

## 1. Intention

La bonne alternance a déjà des pages SEO par ville, par métier et par diplôme (`/alternance/ville|metier|diplome/<slug>`). On ajoute un quatrième type : la page secteur, par exemple `/alternance/secteur/informatique`.

Le but est d'aller chercher du trafic sur les requêtes de domaine que tapent les étudiants, comme « alternance informatique » ou « alternance comptabilité ». Une page secteur doit aussi répondre aux requêtes métier du domaine, comme « alternance technicien informatique ». Elle doit apporter tout de suite de la valeur à un étudiant qui hésite sur son orientation : quels métiers existent dans ce secteur, s'il recrute, où sont les offres, à qui envoyer une candidature spontanée, quelle formation suivre et combien on gagne.

Ce lot pose aussi le socle des pages qui suivront après la réunion de cadrage : secteur public, Armées, puis pages employeurs.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**

- 10 pages secteur en ligne, dont le contenu est rempli et vérifié.
- Les pages emploient le vocabulaire des étudiants dans les titres, les URL, les libellés de métiers et les balises meta, pas le libellé ROME ni notre jargon.
- Chaque page a un bloc et un bouton vers les offres d'emploi, et un autre bloc et bouton vers les candidatures spontanées (demande de la réunion).
- Les compteurs et les listes calculés sont rafraîchis chaque jour, pour qu'une page ne paraisse jamais vide ou périmée (demande de la réunion).
- Chaque chiffre de marché affiché cite sa source et sa date.

**Non-objectifs, renvoyés à plus tard**

- Le secteur public, les Armées et les pages employeurs.
- Les données France 2030 / Métiers 2030 sur l'avenir des secteurs.
- La récupération automatique des chiffres BMO ou de l'API Marché du travail : en v1, ils sont saisis à la main une fois par an.
- Un filtre par code ROME dans la recherche.
- La création des pages métier manquantes : la page secteur en produit la liste, mais elles feront l'objet d'un autre lot.

**Anti-objectifs : ce qui ferait de ce lot un échec, même techniquement réussi**

- Une page secteur qui prend la place d'une de nos pages existantes dans Google. Exemple : sur « alternance petite enfance », c'est `/alternance/diplome/cap-aepe` qui sort aujourd'hui en premier.
- Des chiffres inventés ou sans source dans le bloc « secteur qui recrute ».
- Une page sans offres, ou des compteurs à zéro en production.
- Un vocabulaire administratif (« Études et développement informatique ») là où l'étudiant tape « développeur ».

## 3. Les 10 secteurs

On les a choisis d'après la demande dans la GSC : requêtes contenant « alternance », du 1er août au 30 octobre 2026, en comptant les requêtes génériques et les requêtes métier du domaine. Le libellé est celui que tapent les étudiants.

| # | Slug | Titre (H1) | Requête pivot (impressions exactes sur 3 mois) | Demande du domaine (approx.) |
|---|---|---|---|---|
| 1 | `commerce` | Alternance commerce | « alternance commerce » (4 900), « commercial » (2 900) | ~117 000 |
| 2 | `informatique` | Alternance informatique | « alternance informatique » (8 700) ; « numérique » n'est presque jamais tapé | ~97 000 |
| 3 | `sante` | Alternance santé | surtout des requêtes métier (secrétaire médicale, assistant dentaire, aide-soignant) | ~70 000 |
| 4 | `comptabilite` | Alternance comptabilité | « alternance comptabilité » (10 600) | ~59 000 |
| 5 | `petite-enfance` | Alternance petite enfance | « CAP petite enfance alternance » (6 200) | ~38 000 avec le social |
| 6 | `rh` | Alternance RH | « alternance rh » (14 100) | ~28 000 |
| 7 | `hotellerie-restauration` | Alternance hôtellerie-restauration | cuisine, hôtellerie | ~25 000 |
| 8 | `immobilier` | Alternance immobilier | « alternance immobilier » | ~23 000 |
| 9 | `esthetique` | Alternance esthétique | « alternance esthétique » (2 100) ; « beauté » absent | ~21 000 avec la coiffure |
| 10 | `sport` | Alternance sport | « alternance sport » | ~18 000 |

Pour garder une trace :
- La banque-assurance arrive 11e (~17 000).
- La comptabilité et les RH sont des fonctions plus que des secteurs. On les garde parce que c'est ainsi que les étudiants raisonnent (décision de Hugo).
- Le social (éducateur, assistante sociale) est rangé dans la page petite enfance.

## 4. Approches envisagées

| Approche | Principe | Pour | Contre |
|---|---|---|---|
| **A. Un secteur = une liste de codes ROME (retenue)** | Nouvelle collection `seo_secteurs`, remplie par migration. Le cron calcule les données à partir des codes ROME, comme pour les pages métier et diplôme. | Réutilise le pipeline existant (`seo.service.ts`), donne des chiffres fiables et des données riches (entreprises, villes, formations, cartes d'offres), et servira aux pages publiques et employeurs. | Les codes ROME de chaque secteur sont choisis à la main. Les boutons vers la recherche passent par un mot-clé, faute de filtre ROME. |
| B. Recherche par mot-clé à l'affichage | La page interroge `/api/v1/search?q=` | Très peu de code | Résultats flous (« Boulanger » remonte des boulangeries), aucune donnée riche, pages pauvres pour le SEO |
| C. Type « secteur » dans `seo_metiers` | On étend le modèle métier | Un peu moins de code | Mélange deux objets différents : le secteur porte une liste de métiers, des liens et une FAQ |

Hugo a validé l'approche A.

## 5. Structure de la page

Ordre validé avec Hugo. La page modèle complète se trouve dans `_temp/secteurs/informatique.md`.

| # | Section | Origine du contenu |
|---|---|---|
| 0 | En-tête : H1 « Alternance {mot} », une phrase d'accroche, 4 chiffres clés (offres, entreprises qui recrutent, entreprises à contacter, candidats sur 3 mois) | phrase saisie à la main, chiffres calculés |
| 1 | Description du secteur : ce qu'il recouvre, les employeurs, ce qu'on y fait en alternance, les niveaux d'entrée (2 paragraphes) | saisie à la main |
| 2 | Les métiers du secteur en alternance : cartes avec le libellé étudiant, une ligne de description, le niveau d'accès, le nombre d'offres et un lien | saisie à la main, sauf le nombre d'offres (calculé) |
| 3 | « {Secteur}, un secteur qui recrute ? » : projets de recrutement BMO et part des recrutements difficiles, avec source et date, le nombre d'offres sur LBA et 2-3 phrases d'interprétation | BMO et texte saisis à la main, compteur LBA calculé |
| 4 | Offres d'alternance : 6 cartes et un bouton « Voir les {n} offres » | calculé |
| 5 | Candidatures spontanées : texte, nombre d'entreprises à contacter et un bouton | texte modèle, compteur calculé |
| 6 | Entreprises qui recrutent : top 6 à 9 | calculé |
| 7 | Quelle formation ? Diplômes par niveau, du CAP au bac+5, avec un lien vers nos pages diplôme quand elles existent, plus le nombre de formations par niveau | diplômes saisis à la main, compteurs calculés |
| 8 | Combien gagne un apprenti ? On réutilise `SalaireSection` | voir § 7, point non tranché |
| 9 | Où trouver une alternance ? Top 10 des villes avec leur compteur, et un lien vers la page ville quand elle existe | calculé |
| 10 | Questions fréquentes : 4 à 6 questions, balisées en `FAQPage` | saisie à la main |
| 11 | Autres secteurs : liens vers les 9 autres pages | dérivé de la collection |

**Métadonnées**
- title : `Alternance {mot} : {n} offres et {m} entreprises qui recrutent | La bonne alternance`
- meta description : saisie à la main, avec les métiers phares et le nombre d'offres.

**Données structurées** : `WebPage`, `BreadcrumbList`, `ItemList` (offres, avec `buildOffresItemList`) et `FAQPage`.

**Fil d'Ariane** : Accueil › Alternance par secteur › {Secteur}. Une page d'index `/alternance/secteurs` liste les 10 secteurs, sur le modèle de `/alternance/metiers`.

**Liens des cartes métier** : vers `/alternance/metier/<slug>` quand la page existe, sinon vers la recherche en mode emplois avec `q=<libellé étudiant>`. Les métiers sans page alimentent la liste des prochaines pages métier à créer.

**Boutons « Voir les offres » et « entreprises à contacter »** : `buildSearchUrl` avec `q` = le champ `q_recherche` du secteur, saisi à la main. Le libellé seul (« santé », « hôtellerie-restauration ») donne peu de résultats en recherche floue : on choisit un mot qui en ramène. *[Mon choix, après relecture.]* `mode: "emplois"` et `is_algo_company` à `[false]` ou `[true]`, plus des paramètres UTM `utm_campaign=lba_seo-prog-secteurs`. On accepte que le nombre de résultats de la recherche diffère du compteur affiché (la recherche est floue). Le libellé du bouton ne doit donc pas promettre un nombre exact de résultats : « Voir les offres en informatique ».

## 6. Données et architecture

### Modèle `seo_secteurs` (`shared/src/models/seo-secteur.model.ts`)

Sur le modèle de `seo-metier.model.ts`.

**Champs saisis à la main** (écrits par la migration) :
- `slug`
- `secteur`, le libellé étudiant (« informatique »)
- `q_recherche`, le mot-clé envoyé à la recherche par les boutons
- `titre`, le H1
- `accroche`
- `meta_description`
- `description`, un tableau de paragraphes
- `metiers[]` : `{ libelle, romes[], description, niveau_acces, metier_slug? }`, où `metier_slug` désigne une page `/alternance/metier` existante
- `marche` : `{ projets_recrutement, part_difficiles, annee, source_libelle, source_url, interpretation }`
- `formations_niveaux[]` : `{ niveau, diplomes, diplome_slug? }`
- `faq[]` : `{ question, reponse }`
- `romes`, l'union des codes ROME des métiers, dérivée à l'écriture

**Champs calculés** (écrits par le cron) :
- `job_count`
- `company_count`
- `algo_company_count`
- `applicant_count`
- `metiers_job_counts`, le nombre d'offres par métier, dans l'ordre de `metiers[]`
- `entreprises`
- `villes`
- `formations`
- `cards`

`SalaireSection` est statique, la page secteur n'a donc pas de champ `salaire`.

Les champs calculés sont optionnels ou ont une valeur par défaut. Le validateur MongoDB rejette les mises à jour partielles quand un champ requis manque, d'où l'ajout en optionnel d'abord : cf. CLAUDE.md.

### Remplissage

On passe par une migration rejouable qui fait un upsert par slug et réécrit les champs saisis à la main, comme `20260925100000-seo-diplomes-lot1-5539.ts`. Un lot de contenu correspond à une migration. Pour modifier un texte plus tard, on écrit une nouvelle migration.

### Calcul : `updateSeoSecteur()` dans `server/src/services/seo.service.ts`

- Elle réutilise les helpers ROME existants : `getJobCountForMetier`, `getCompanyCountForMetier`, `getApplicantCountForMetier`, `getTopCompaniesForMetier`, `getTopCitiesForMetier`, `getFormationsForMetier` et `getJobsForMetier`. On peut renommer ces helpers en `...ForRomes` puisqu'ils servent désormais à trois types de pages. Dans ce cas, chercher les commentaires qui les citent.
- **Séparer les offres des entreprises à contacter.** Aujourd'hui, `getJobCountForMetier`, `getTopCompaniesForMetier`, `getTopCitiesForMetier` et `getJobCards` comptent aussi les `jobs_partners` dont `partner_label = RECRUTEURS_LBA`. `getJobCards` renvoie jusqu'à 12 cartes, dont jusqu'à 6 entreprises algo. Sur la page secteur, « offres » ne doit compter que les offres, et les entreprises à contacter forment un compteur à part. On ajoute aux helpers un paramètre (par exemple `{ includeAlgo }`) dont la valeur par défaut reproduit le comportement actuel : les chiffres des pages métier et diplôme ne changent pas dans ce lot. Leur correction éventuelle est une suite (§ 9). *[Mon choix, après relecture.]*
- Le nouveau helper `getAlgoCompanyCountForRomes(romes)` compte les entreprises à contacter, c'est-à-dire les `jobs_partners` actifs avec `partner_label = RECRUTEURS_LBA` sur ces codes ROME, regroupés par SIRET.
- Le bloc « Offres » affiche les 6 premières cartes d'offres, sans entreprise algo.
- Les helpers renvoient 6 entreprises et 6 villes, ces dernières prises dans une liste fixe de 20 villes. La page affiche ce qu'ils renvoient (6 et 6), pas 10.
- Un secteur qui échoue journalise l'erreur sans bloquer les autres, comme pour les métiers.

### Rafraîchissement quotidien

`updateSEO` tourne aujourd'hui **une fois par semaine** (`0 4 * * SAT`, `server/src/jobs/jobs.ts`). La réunion demande une mise à jour quotidienne. Choix : on ajoute un cron quotidien dédié, `updateSeoSecteurs`, et on laisse l'hebdomadaire existant inchangé, pour ne pas changer la charge des pages ville, métier et diplôme dans ce lot. Pas de `concurrency: exclusive` (cf. CLAUDE.md).

**Avant le premier calcul, et quand un compteur est à zéro** *[mon choix, après relecture]* :
- la migration de contenu appelle `updateSeoSecteurs()` à la fin, comme les migrations diplôme ;
- tant que `job_count` est absent ou vaut 0, la page porte `noindex` et masque les blocs calculés vides ; elle reste accessible ;
- le sitemap reste statique (`secteur_data`).

### API et UI

- Route privée `GET /_private/seo/secteur/:secteur` dans `shared/src/routes/_private/seo.routes.ts`, plus son handler serveur, sur le modèle de `/_private/seo/metier/:metier`.
- Page `ui/app/(editorial)/alternance/secteur/[secteur]/page.tsx`, sur le modèle de la page métier :
  - `"use cache: private"` et `cacheLife("hours")` sur le fetch, parce que `apiGet` lit `headers()`, cf. CLAUDE.md ;
  - `Suspense` avec `LoadingEmptySpace` ;
  - `notFound()` si le slug est inconnu.
- On réutilise les composants existants : `CarteOffre`, `JobsCtaTracked` (en ajoutant `"page_secteur"` au type de `searchOrigin`, limité aujourd'hui à `page_ville | page_metier`), `SalaireSection`, `SchemaOrg`, `Breadcrumb` et `HomeCircleImageDecoration`.
- `PAGES.dynamic.seoSecteur` et `PAGES.static.alternanceSecteurs` dans `ui/utils/routes.utils.ts`.
- `secteur_data` dans `ui/app/(editorial)/alternance/_components/`, avec slug et libellé, sur le modèle de `metier_data` : il sert au sitemap, à `llms.txt` et à la page d'index (cf. `generate-main-sitemap.ts`).
- Page d'index `/alternance/secteurs`.
- Liens entrants : ajouter les secteurs à la navigation des hubs existants (`landing_links.ts`, pages `/alternance/metiers` et `/alternance/diplomes`). La page secteur renvoie vers les pages métier, diplôme et ville. Il reste à choisir si les pages métier renvoient vers leur secteur : voir § 7.
- Indexation : par le sitemap, puis une soumission manuelle des URL dans la Search Console. `pingIndexNow` et `pingGoogleIndexing` ne traitent que les URL d'offres, et l'API Google Indexing est réservée aux pages qui portent un `JobPosting`. Aucune page SEO ne passe par eux aujourd'hui.

### Contenu : processus

Pour chaque secteur, le contenu saisi à la main est rédigé sur le modèle `_temp/secteurs/informatique.md`, puis vérifié :
- les codes ROME, sur le référentiel ROME v4 ;
- les chiffres BMO, sur le fichier France Travail de l'année ;
- les diplômes, sur RNCP / Onisep.

C'est le même niveau d'exigence que pour les lots diplôme, où chaque affirmation est vérifiée sur une source officielle.

## 7. Points non tranchés

- **Cannibalisation** :
  - La page petite enfance doit pointer vers `/alternance/diplome/cap-aepe` et se positionner sur le domaine, pas sur le diplôme.
  - Le sort de `/metiers/ressources-humaines` (57 000 impressions, page plus ancienne) face à la page RH reste à décider : redirection, différenciation ou coexistence.
- **Salaire au niveau du secteur** : la source du `salaire_brut_moyen` des pages métier reste à identifier. Faute de source fiable au niveau du secteur, on n'affiche que le minimum légal de l'apprenti (pourcentage du Smic selon l'âge et l'année de contrat).
- **Lien retour des pages métier vers leur secteur** : souhaitable pour le maillage, mais cela touche des pages qui rankent déjà.

## 8. Laissé au développeur

- Le découpage en composants de la page secteur, et la factorisation éventuelle avec la page métier.
- Le nom exact des helpers une fois renommés.
- Le design détaillé des cartes métier et du bloc « secteur qui recrute », dans le respect du DSFR et des styles des pages SEO existantes (`hub-styles.ts`).
- Les tests :
  - un test de migration rejouable, sur le modèle de `server/tests/integration/migrations/seo-diplomes-lot*.test.ts` ;
  - un test d'intégration pour `updateSeoSecteur`, à créer de zéro car `seo.service.ts` n'a pas de test de service ; il doit vérifier que les offres et les entreprises à contacter sont comptées séparément ;
  - pas de test e2e : aucune page SEO n'en a aujourd'hui.

## 9. Suites identifiées

- Les pages métier manquantes, listées par les cartes « recherche préremplie » des 10 secteurs et classées par demande GSC.
- Un filtre ROME dans la recherche, pour que les boutons tombent exactement sur les offres du secteur.
- La récupération automatique des données de marché (API Marché du travail de France Travail, déjà intégrée côté authentification dans `config.ts`), et nos propres données d'historique des offres.
- Les pages secteur public, Armées et employeurs.
- La séparation offres / entreprises à contacter dans les compteurs des pages métier et diplôme : aujourd'hui, ils les mélangent.
