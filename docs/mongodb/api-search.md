# API Search — Référence d'intégration

Endpoint de recherche unifié utilisant **MongoDB Search** (mongot / Lucene) sur la collection `search_items`.

## Endpoint

```
GET /api/v1/search
```

## Paramètres de requête

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `q` | `string` | — | Texte libre (fuzzy, analyse française, 1 typo toléré) |
| `type` | `string` | — | `"offre"` ou `"formation"` |
| `mode` | `string` | — | Type de recherche : `emplois` (offres hors CFA/GEIQ), `formations`, ou `emplois_formation` (offres CFA/GEIQ uniquement, cf. `is_formation_included`) |
| `type_filter_label` | `string` | — | Libellé de type pour l'affichage des filtres |
| `contract_type` | `string \| string[]` | — | Ex: `"Apprentissage"` ou `["Apprentissage","Contrat pro"]` |
| `level` | `string` | — | Niveau européen de diplôme : `"3"` à `"7"` |
| `activity_sector` | `string` | — | Secteur d'activité |
| `organization_name` | `string` | — | Filtre par nom d'entreprise (exact) |
| `is_disabled_elligible` | `"true" \| "false"` | — | `true` : uniquement les offres éligibles aux personnes en situation de handicap |
| `start_type` | `string` | — | Mode de démarrage du contrat : `des_que_possible` ou `precise_date` |
| `start_date` | `Date` (ISO 8601) | — | Date de début souhaitée : offres démarrant avant ou à cette date (`$lte`, borne incluse), OU à date flexible (`is_start_flexible`), OU sans date de démarrage (candidatures spontanées, offres sans date — non impactées, ordre de pertinence conservé) |
| `smart_apply` | `"true" \| "false"` | — | `true` : uniquement les offres avec candidature simplifiée |
| `is_algo_company` | `"true" \| "false"` | — | `true` : entreprises à contacter (candidatures spontanées) ; `false` : offres d'emploi ; absent : les deux |
| `sort` | `string` | — | Tri : `proximity` (géo), `date`, `applications` (nb de candidatures croissant), `start_date` (date de début croissante, docs sans date écartés). Défaut : pertinence (cf. `current-behavior.md` §1) |
| `latitude` | `number` | — | Latitude WGS84 |
| `longitude` | `number` | — | Longitude WGS84 |
| `radius` | `number` | `30` | Rayon de recherche en km |
| `page` | `number` | `0` | Index de page (commence à 0) |
| `hitsPerPage` | `number` | `20` | Résultats par page (max `100`) |

## Structure de réponse

```json
{
  "hits": [ /* tableau de résultats ISearchItem */ ],
  "nbHits": 142,
  "page": 0,
  "nbPages": 8,
  "facets": {
    "type": { "offre": 120, "formation": 22 },
    "type_filter_label": { "Offre d'emploi en alternance": 80, "...": 40 },
    "contract_type": { "Apprentissage": 95, "Contrat de professionnalisation": 25 },
    "level": { "3": 40, "4": 35, "5": 30, "6": 20, "7": 17 },
    "activity_sector": { "Informatique": 35, "BTP": 28 },
    "organization_name": { "SNCF": 12, "Orange": 8 }
  },
  "counts": { "is_disabled_elligible": 115 }
}
```

- **`counts.is_disabled_elligible`** : nombre d'offres éligibles handicap dans le result set (compteur de la chip « Employeur handi-engagé »). Disjonctif : le filtre handi lui-même est exclu de son calcul (le compteur ne retombe pas quand on l'active). Les facettes mongot ne supportant pas les booleans, il est calculé via un `$searchMeta` dédié.

## Champs d'un résultat (`ISearchItem`)

| Champ | Type | Description |
|---|---|---|
| `url_id` | `string` | Slug pour construire l'URL de détail |
| `type` | `string` | `"offre"` ou `"formation"` |
| `type_filter_label` | `string` | Label lisible pour l'affichage des filtres |
| `sub_type` | `string` | Sous-catégorie |
| `contract_type` | `string[]` | Types de contrat |
| `publication_date` | `Date` (ISO 8601) | Date de publication |
| `is_disabled_elligible` | `boolean \| null` | Offre éligible aux personnes en situation de handicap (`null` pour les formations) |
| `start_date` | `Date \| null` | Date de début de contrat (offres uniquement, `null` pour recruteurs/formations) |
| `start_type` | `string \| null` | Mode de démarrage : `des_que_possible` ou `precise_date` (offres uniquement) |
| `is_start_flexible` | `boolean \| null` | Date de démarrage flexible (offres uniquement) |
| `is_algo_company` | `boolean \| null` | Candidature spontanée issue de l'algo recruteurs — reléguée en fin de tri par date |
| `is_formation_included` | `boolean \| null` | Offre émise par un CFA (`is_delegated`) ou un GEIQ (whitelist SIRET) : « emploi avec formation incluse » (`null` pour les formations) |
| `smart_apply` | `boolean` | `true` si la candidature rapide est disponible |
| `application_count` | `number` | Nombre de candidatures déjà reçues |
| `title` | `string` | Titre de l'offre ou de la formation |
| `description` | `string` | Description |
| `address` | `string` | Adresse complète |
| `location` | `{ type: "Point", coordinates: [lng, lat] }` | Coordonnées GeoJSON (MongoDB Search) — seul champ géo |
| `organization_name` | `string` | Nom de l'entreprise |
| `level` | `string \| null` | Niveau de diplôme visé |
| `activity_sector` | `string \| null` | Secteur d'activité |
| `keywords` | `string[]` | Mots-clés indexés |
| `distance` | `number \| null` | Distance en km au lieu recherché (`null` si pas de géo) — ajouté à la réponse, hors `ISearchItem` |

## Exemples d'appels

```bash
# Recherche textuelle
GET /api/v1/search?q=développeur+web

# Recherche géographique (20 km autour de Paris)
GET /api/v1/search?latitude=48.86&longitude=2.35&radius=20

# Filtrage par type et contrat
GET /api/v1/search?type=offre&contract_type=Apprentissage

# Combiné : texte + géo + filtre
GET /api/v1/search?q=dev&latitude=48.86&longitude=2.35&radius=30&type=offre

# Tri par proximité (nécessite une géo)
GET /api/v1/search?latitude=48.86&longitude=2.35&radius=30&sort=proximity

# Pagination
GET /api/v1/search?q=web&page=2&hitsPerPage=10
```

## Notes d'intégration frontend

- **Pagination** : utiliser `page` (0-based) et `nbPages` pour les contrôles. `nbHits` est renvoyé et sert au bouton mobile « Voir les N résultats », mais **n'est plus affiché en en-tête de la liste** (choix POC).
- **Facettes** : renvoyées par l'API et utilisées pour alimenter les options de filtre disponibles (accumulées en `stableFacets`). En revanche, **les compteurs par valeur ne sont plus affichés** dans les filtres (desktop et sections mobiles).
- **contract_type** : peut être passé plusieurs fois dans la query string (`?contract_type=Apprentissage&contract_type=Contrat+pro`)
- **Géo** : les paramètres `latitude`, `longitude` et `radius` sont indépendants du texte — entièrement combinables
- **Lien de détail** : construire l'URL depuis `url_id` et `type` (ex: `/offre/{url_id}`)
- **`smart_apply`** : afficher le badge "Postuler rapidement" lorsque `true`
- **Tri** : configurable via `sort` (`proximity` / `date` / `applications` / `start_date`). Par défaut : pertinence, avec `smart_apply` puis `application_count` (moins candidatées d'abord) en tie-break. Le tri `smart_apply` a été retiré (« Candidature simplifiée » est un filtre). Détail des étapes dans [`current-behavior.md`](./current-behavior.md) §1.

## Recherche textuelle « Métier » (`q`)

### Côté moteur — règle de matching

Définie par `buildTextClauses` ([`search.service.ts`](../../server/src/services/search/search.service.ts)). Le `q` est interprété par **deux clauses Atlas Search en `should` (OR, `minimumShouldMatch: 1`)** : un document remonte s'il satisfait **au moins une** clause.

| # | Champs (`path`) | Analyseur / mécanisme |
|---|---|---|
| 1 | `title`, `description`, `keywords`, `organization_name` | `lucene.french` + **fuzzy 1 typo** (`maxEdits: 1`) |
| 2 | mêmes 4 champs en variante `.standard` | analyseur standard + **synonymes `lba_synonyms`** (expansion d'abréviations, ex. `ccgo` → « Chef de chantier gros œuvre ») |

- Les 4 champs interrogés incluent les **mots-clés générés par Mistral** (`keywords`) et le nom d'entreprise.
- Le **score** (`searchScore`) de ce match pilote le tri **par défaut** (cf. [`current-behavior.md`](./current-behavior.md) §1).
- En tri `sort=proximity`, ces deux clauses **basculent en `filter`** (elles ne scorent plus) ; le score provient alors de l'opérateur `near`.
- `q` est **optionnel** : sans `q`, aucune clause texte n'est ajoutée (la recherche repose sur la géo et les filtres).

### Côté front — champ « Métier » (`/beta/recherche`)

Composant [`SearchBar.tsx`](../../ui/app/beta/_components/SearchBar.tsx) :

- **Champ texte libre** « Que recherchez-vous ? » (`Autocomplete` freeSolo) — **aucun référentiel métier imposé** (pas de liste ROME fermée).
- **Suggestions** : endpoint dédié `/v1/search/suggest?q=<saisie>&limit=8` (contenu indexé + suggestions apprises), *throttle* ~300 ms, à partir de **3 caractères**. Dropdown : 1ʳᵉ ligne « Rechercher : {saisie} » (recherche texte libre) + groupe « Suggestions » avec la sous-chaîne matchée en gras.
- **Déclenchement de la recherche** (pas de bouton de soumission sur la page résultats) : touche **Entrée**, **sélection d'une suggestion** ou de la ligne « Rechercher : … », ou **vidage** du champ (retire `q`).

## Architecture technique

- **Collection** : `search_items` (MongoDB)
- **Index de recherche** : `search_items_index` (mongot / Lucene)
- **Champs full-text** : `title`, `description`, `keywords`, `organization_name` (analyseur `lucene.french`)
- **Champs filtrables** : `type`, `type_filter_label`, `sub_type`, `contract_type`, `level`, `activity_sector`, `organization_name`, `is_disabled_elligible`, `start_type`, `start_date` (range), `smart_apply`, `is_algo_company`, `is_formation_included`
- **Géosearch** : champ `location` (GeoJSON Point), rayon en mètres dans l'opérateur `geoWithin`
- **Facettes** : calculées via `$searchMeta` en parallèle de la requête principale
