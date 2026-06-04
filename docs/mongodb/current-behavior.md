# Comportement actuel — `/v1/search` & pages POC `/search/*`

> État du POC de recherche MongoDB Search (mongot) au-dessus de la collection `algolia`.
> Couvre : le **tri** des résultats, le champ **distance**, la **géo**, et le fonctionnement des pages **`/search/split`** et **`/search/filter-only`**.

---

## 1. Tri des résultats (`/v1/search`)

Défini dans le `$search` de [`search.service.ts`](../../server/src/services/search/search.service.ts) :

```ts
sort: {
  score: { $meta: "searchScore", order: -1 },  // 1. pertinence (décroissant)
  smart_apply: { order: 1 },                    // 2. tie-break (croissant)
  application_count: { order: 1 },              // 3. tie-break (croissant)
}
```

Ordre appliqué :

1. **`searchScore` décroissant** — pertinence du match texte `q` (meilleures correspondances d'abord).
2. **`smart_apply` croissant** — `false` (0) avant `true` (1).
3. **`application_count` croissant** — offres avec **moins de candidatures** d'abord (visibilité aux moins sollicitées).

### ⚠️ Conséquence sans texte (`q` absent)

Quand il n'y a **pas de `q`** (cas de `/search/filter-only`, et de `/search/split` tant qu'aucun métier n'est saisi), le `compound` ne contient que des clauses **`filter`** (type, contrat, géo…). Ces clauses **ne contribuent pas au score** → `searchScore` est **constant** pour tous les documents. Le tri se résume alors à :

> `smart_apply` (non-smart d'abord) puis `application_count` (moins candidatées d'abord).

Donc, pour ces vues :

- **Pas de tri par distance** — l'offre la plus proche n'est pas remontée en premier (même si la distance est affichée).
- **Pas de tri par date** de publication.

---

## 2. Champ `distance`

Ajouté à la réponse `/v1/search` ([`search.routes.ts`](../../shared/src/routes/search.routes.ts), [`search.service.ts`](../../server/src/services/search/search.service.ts)).

- Calculé en **haversine** (`getDistanceInKm`, [`geolib.ts`](../../server/src/common/utils/geolib.ts), arrondi `Math.ceil`) entre le lieu recherché (`latitude`/`longitude`) et le `_geoloc` de chaque hit.
- **`null`** si la recherche n'est pas géolocalisée (pas de `latitude`/`longitude`).
- Affiché en front uniquement quand `hit.distance != null` (« X km(s) du lieu de recherche »).

---

## 3. Géo : le champ `location` doit être peuplé

- Le filtre géo utilise l'opérateur Atlas Search **`geoWithin`** (cercle, rayon en mètres) sur le champ **`location`** (GeoJSON `Point [lng, lat]`, mappé `type: "geo"` dans l'index `algolia_search`).
- Les documents portent **deux** champs géo : `_geoloc { lat, lng }` (format Algolia historique) et `location` (GeoJSON, requis par mongot).
- **Si `location` est absent/`null`, toute recherche géo renvoie `0` résultat** (le `geoWithin` ne matche rien) — alors que la recherche globale fonctionne.
- Backfill : job [`OneTimeJob_AddLocationToAlgolia`](../../server/src/jobs/oneTimeJob/addLocationToAlgolia.ts) (`yarn cli OneTimeJob_AddLocationToAlgolia`) remplit `location` depuis `_geoloc`. À jouer après tout import qui ne renseigne que `_geoloc`.

---

## 4. Faceting disjoint (compteurs stables)

Les facettes sont calculées via `$searchMeta` sur un **compound « baseline » = `q` + géo uniquement** (`buildBaselineCompound`), **sans** les filtres de dimension. Résultat : cocher une valeur **n'effondre pas** les compteurs des autres options — tous les buckets restent visibles. Le front accumule en plus `stableFacets` (les options vues ne disparaissent jamais).

---

## 5. Pages POC `/search/*`

### Routes

| Route | Vue | Statut |
|---|---|---|
| `/search/split` | Vue scindée (liste gauche + détail droite) avec barre recherche + filtres | POC actif |
| `/search/filter-only` | Variante « une ligne » (Lieu · Type · Contrat · Niveau · + de filtres), même split | POC actif |
| ~~`/search`~~ | Ancienne page non scindée | **Supprimée** |

### Plomberie commune (réutilisée par les deux)

- **État piloté par l'URL** : `ISearchPageParams` + `buildSearchUrl`/`parseSearchPageParams` ([`search.params.utils.ts`](../../ui/app/search/_utils/search.params.utils.ts)). `buildSearchUrl` pointe par défaut vers `/search/split`.
- **Données + scroll infini** : `useSearchResults` ([`useSearchResults.ts`](../../ui/app/search/_hooks/useSearchResults.ts)) — TanStack `useInfiniteQuery`, pagination par `pageParam`, chargement via **`IntersectionObserver` sentinel** ([`SearchResultsList.tsx`](../../ui/app/search/_components/SearchResultsList.tsx)). Pas de virtualizer.
- **Sélection détail** : param URL `selected` (= `hit.url_id`), posé par clic carte en `router.replace` (shallow). Desktop = pas de navigation page ; mobile = navigation vers la page détail.
- **Facettes** : `/v1/search` → `facets`, accumulées en `stableFacets`.
- **Filtres multi** : `SearchMultiSelectField` = MUI `Select multiple` (pilule + label, compteurs, tri alpha, sous-groupes `Type` via `ListSubheader`). Mapping `type_filter_label` → Formation/Offre d'emploi **codé en dur** ([`search.type-groups.ts`](../../ui/app/search/_utils/search.type-groups.ts)).
- **Entreprise** : `SearchEntrepriseAutocomplete` (mono-valeur `organization_name`, `downshift`, ≤100 buckets).
- **Tags actifs** : `SearchActiveFilters` (groupés par catégorie, `Tag` DSFR dismiss, « Effacer tous » si > 1).
- **Mobile** : header burger DSFR (`PublicHeader`) + 2 boutons sticky (« Modifier la recherche » / « Filtrer ») ouvrant des panneaux plein écran. Bascule desktop/mobile en **CSS breakpoints (`lg` 992px)**, **pas de `useMediaQuery`** (évite le flash d'hydratation).
- **Footer** : `Footer` DSFR rendu sous le shell plein écran (révélé au scroll en desktop).

### Spécifique `/search/split`

- Barre : **Métier** (texte libre `q`) + **Lieu** + bouton « C'est parti », puis ligne de filtres (`SearchFilters`) + tags.
- Layout desktop : conteneur `DefaultContainer` (xl, 1536px) ; split liste 480px / détail en **carte blanche sur fond gris**.

### Spécifique `/search/filter-only`

- Barre **« une ligne »** : `[Lieu + bouton Rechercher intégré]` · séparateur · `Type` · `Contrat` · `Niveau` · `[+ Plus de filtres]` → déplie `Secteur` + `Entreprise`.
- **Pas de champ Métier** (`q` non utilisé) → recherche pilotée par lieu + filtres (cf. §1, conséquence sur le tri).
- Bouton « Rechercher » **dans** le champ Lieu via `InputAdornment` (Autocomplete `disableClearable`, vidage géré sur input vide).

### Rayon automatique (les deux vues)

- **Le champ rayon/distance est retiré de l'UI.**
- Défaut `radius = 20` km. À chaque **nouveau lieu**, on repart de **20**.
- [`useAutoRadius`](../../ui/app/search/_hooks/useAutoRadius.ts) : si un lieu est défini et que la recherche renvoie **0 résultat**, élargit le rayon par **paliers de 20 km jusqu'à 100** (20 → 40 → … → 100). Le scroll infini gère ensuite le chargement progressif.

---

## Limitations connues

- **Tri non géographique / non chronologique** sans `q` (cf. §1) : pas de « plus proche d'abord » ni « plus récent d'abord ».
- **Distance** affichée mais non utilisée pour le tri.
- Le `radius` par défaut de l'API reste `30` ([`search.routes.ts`](../../shared/src/routes/search.routes.ts)) ; côté front les vues forcent `20` et l'auto-élargissement.
- Mobile : barre + panneaux **dupliqués** dans le client `filter-only` (vue de test, pas d'extraction partagée).
