# Comportement actuel — `/v1/search` & pages POC `/search/*`

> État du POC de recherche MongoDB Search (mongot) au-dessus de la collection `search_items`.
> Couvre : le **tri** des résultats, le champ **distance**, la **géo**, et le fonctionnement des pages **`/search/split`** et **`/search/filter-only`**.

---

## 1. Tri des résultats (`/v1/search`)

Le tri est **configurable** via le paramètre `sort` (`buildSortStage` / `buildCompoundOperator` dans [`search.service.ts`](../../server/src/services/search/search.service.ts)). Valeurs possibles : `proximity`, `smart_apply`, `date` — sinon tri par défaut.

| `sort` | Étape de tri appliquée |
|---|---|
| _(absent, défaut)_ | `searchScore` desc, puis `smart_apply` asc (non-smart d'abord), puis `application_count` asc (moins candidatées d'abord) |
| `date` | `publication_date` desc (plus récent d'abord) |
| `smart_apply` | `smart_apply` desc (candidature simplifiée d'abord), puis `searchScore` desc, puis `application_count` asc |
| `proximity` (+ géo) | tri par `searchScore` desc, le score étant **fourni par l'opérateur `near`** sur `location` (pivot 1 km) → **plus proche d'abord**. Le texte `q` bascule alors en `filter`. |

> `proximity` n'a d'effet qu'avec une géolocalisation (`latitude`/`longitude`). Sans géo, on retombe sur le tri par défaut.

### ⚠️ Tri par défaut sans texte (`q` absent)

Quand il n'y a **pas de `q`** (cas fréquent de `/search/filter-only`, et de `/search/split` tant qu'aucun métier n'est saisi) **et** que le tri reste au défaut, le `compound` ne contient que des clauses **`filter`** qui **ne contribuent pas au score** → `searchScore` est **constant**. Le tri se résume alors à `smart_apply` puis `application_count`. Les tris explicites `date` et `proximity` restent eux pleinement opérants.

---

## 2. Champ `distance`

Ajouté à la réponse `/v1/search` ([`search.routes.ts`](../../shared/src/routes/search.routes.ts), [`search.service.ts`](../../server/src/services/search/search.service.ts)).

- Calculé en **haversine** (`getDistanceInKm`, [`geolib.ts`](../../server/src/common/utils/geolib.ts), arrondi `Math.ceil`) entre le lieu recherché (`latitude`/`longitude`) et le champ **`location`** (GeoJSON `[lng, lat]`) de chaque hit.
- **`null`** si la recherche n'est pas géolocalisée (pas de `latitude`/`longitude`) ou si le hit n'a pas de `location`.
- Affiché en front uniquement quand `hit.distance != null` (« X km(s) du lieu de recherche »).

---

## 3. Géo : le champ `location` doit être peuplé

- Le filtre géo utilise l'opérateur Atlas Search **`geoWithin`** (cercle, rayon en mètres) sur le champ **`location`** (GeoJSON `Point [lng, lat]`, mappé `type: "geo"` dans l'index `search_items_index`). Le tri par proximité utilise `near` sur ce même champ (cf. §1).
- **`location` est le seul champ géo** du modèle ([`searchItems.model.ts`](../../shared/src/models/searchItems.model.ts)). L'ancien champ Algolia `_geoloc { lat, lng }` a été **supprimé**, ainsi que le job de backfill `OneTimeJob_AddLocationToAlgolia`.
- **Si `location` est absent/`null`, toute recherche géo renvoie `0` résultat** (le `geoWithin` ne matche rien) — alors que la recherche globale fonctionne.
- Alimentation : le job [`fillSearchItemsCollection`](../../server/src/jobs/search/generateSearchItemsCollection.ts) écrit `location` **à la source** pour chaque document (formations, jobs, recruteurs) — aucun backfill nécessaire sur les données régénérées.

---

## 4. Faceting disjonctif (filtres dynamiques et synchronisés)

Les facettes sont **dynamiques** : chaque facette est recalculée via `$searchMeta` avec tous les filtres actifs **sauf le sien** (`buildFacetCompound` / `buildFacetGroups`). Conséquences :

- Sélectionner une valeur dans un filtre **restreint les options des autres filtres** (synchronisation).
- Une facette **ne masque pas ses propres options** en multi-sélection (on peut toujours ajouter une 2ᵉ valeur — logique OR au sein d'un filtre).
- Les options **indisponibles n'apparaissent plus** ; si un filtre n'a aucune option, son champ **reste affiché mais désactivé** (côté front).

Optimisation : 1 requête `$searchMeta` pour toutes les dimensions non sélectionnées (+ `type`), puis 1 requête par dimension sélectionnée. Le front n'accumule plus de `stableFacets` — il affiche les compteurs live, en gardant toujours les valeurs sélectionnées (pour pouvoir les retirer).

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
- **Filtres multi** : `SearchMultiSelectField` = MUI `Select multiple` (pilule + label, tri alpha, sous-groupes `Type` via `ListSubheader`). La pilule fermée affiche « Label (N) » où **N = nombre de valeurs sélectionnées** ; les **compteurs par valeur ont été retirés** des options (desktop et sections mobiles). Mapping `type_filter_label` → Formation/Offre d'emploi **codé en dur** ([`search.type-groups.ts`](../../ui/app/search/_utils/search.type-groups.ts)).
- **Tri** : `SearchSortSelect` (« Trier par : Proximité / Candidature simplifiée / Date de publication ») placé dans la colonne de gauche, au-dessus de la liste (desktop et mobile). Pilote le param `sort` (cf. §1) ; « Proximité » désactivée sans géo.
- **Entreprise** : `SearchEntrepriseAutocomplete` (mono-valeur `organization_name`, `downshift`, ≤100 buckets).
- **Tags actifs** : `SearchActiveFilters` (groupés par catégorie, `Tag` DSFR dismiss, « Effacer tous » si > 1).
- **Mobile** : header burger DSFR (`PublicHeader`) + 2 boutons sticky (« Modifier la recherche » / « Filtrer ») ouvrant des panneaux plein écran. Bascule desktop/mobile en **CSS breakpoints (`lg` 992px)**, **pas de `useMediaQuery`** (évite le flash d'hydratation).
- **Footer** : `Footer` DSFR rendu sous le shell plein écran (révélé au scroll en desktop).

### Spécifique `/search/split`

- Barre : **Métier** (texte libre `q`) + **Lieu**, puis ligne de filtres (`SearchFilters`) + tags. **Pas de bouton de soumission** : la recherche se déclenche sur Entrée, sélection d'une suggestion métier, ou sélection d'un lieu.
- Layout desktop : conteneur `DefaultContainer` (xl, 1536px) ; split liste 480px / détail en **carte blanche sur fond gris**.

### Spécifique `/search/filter-only`

- Barre **« une ligne »** : `[Lieu + bouton Rechercher intégré]` · séparateur · `Type` · `Contrat` · `Niveau` · `[+ Plus de filtres]` → déplie `Secteur` + `Entreprise`.
- **Pas de champ Métier** (`q` non utilisé) → recherche pilotée par lieu + filtres (cf. §1, conséquence sur le tri par défaut).
- Champ Lieu : recherche déclenchée par la sélection d'une adresse ; **croix native de réinitialisation** (Autocomplete clearable) qui vide le champ et retire le filtre géo.

### Rayon automatique (les deux vues)

- **Le champ rayon/distance est retiré de l'UI.**
- Défaut `radius = 20` km. À chaque **nouveau lieu**, on repart de **20**.
- [`useAutoRadius`](../../ui/app/search/_hooks/useAutoRadius.ts) : si un lieu est défini et que la recherche renvoie **0 résultat**, élargit le rayon par **paliers de 20 km jusqu'à 100** (20 → 40 → … → 100). Le scroll infini gère ensuite le chargement progressif.

---

## Limitations connues

- **Tri par défaut sans `q`** (cf. §1) : ni « plus proche » ni « plus récent » d'abord. Les tris explicites `proximity` et `date` lèvent cette limite, mais ne sont appliqués que si l'utilisateur les sélectionne.
- Le `radius` par défaut de l'API reste `30` ([`search.routes.ts`](../../shared/src/routes/search.routes.ts)) ; côté front les vues forcent `20` et l'auto-élargissement.
- Données legacy : un document sans `location` (non régénéré par `fillSearchItemsCollection`) sort des recherches géo et a une `distance` nulle (plus de job de backfill).
- Mobile : barre + panneaux **dupliqués** dans le client `filter-only` (vue de test, pas d'extraction partagée).
- **Local — mongot `AuthenticationFailed` après changement de `MONGOT_PASSWORD`** : le `createUser mongotUser` d'[`env-init.sh`](../../.bin/scripts/env-init.sh) ne synchronise pas le mot de passe si un `mongotUser` existe déjà dans le volume MongoDB persistant (le `dropUser` préalable peut échouer / l'ancien user survit). Symptôme : mongot en boucle de redémarrage. Correctif manuel : re-jouer le bloc `dropUser`/`createUser` d'env-init avec la valeur courante de `.infra/local/mongot_password`, puis `docker compose restart mongot`. Réinitialiser le volume (`yarn services:clean`) repart d'un état propre.
- **Preview — mongot `AuthenticationFailed` après changement de `MONGOT_PASSWORD` au vault** : même cause côté serveur. Le `createUser` du playbook ([`preview_pr_mongodb82.yml`](../../.infra/ansible/tasks/preview_pr_mongodb82.yml)) est un resync idempotent qui lit **le même fichier** que mongot — sur un deploy complet et propre il ne peut pas diverger. Mais si un **redeploy réécrit le fichier mot de passe (nouvelle valeur) sans atteindre le `createUser`** (échec entre les deux tâches) **et que le volume mongo `*_mongodb82` survit** (le `down --volumes` de la tâche « Stop existing application » porte `ignore_errors: true`), la base garde l'ancien `mongotUser` alors que mongot lit la nouvelle valeur → boucle de redémarrage. Correctif manuel sur le serveur (PR `N`) :
  ```bash
  PR=N
  KEYFILE="$(cat /opt/app/projects/$PR/mongo_keyfile)"
  MV="$(cat /opt/app/projects/$PR/mongot_password)"
  docker exec -e MV="$MV" lba_${PR}_mongodb mongosh \
    "mongodb://__system:${KEYFILE}@127.0.0.1:27017/admin?authSource=local&directConnection=true" --quiet \
    --eval 'try{db.dropUser("mongotUser")}catch(e){}; db.createUser({user:"mongotUser",pwd:process.env.MV,roles:[{role:"searchCoordinator",db:"admin"}]})'
  docker restart lba_${PR}_mongot
  ```
  Comme le mot de passe change rarement, on garde ce correctif manuel plutôt qu'un wipe de volume forcé dans le playbook. Pour fiabiliser si besoin un jour : supprimer explicitement les volumes `{{ pr_number }}_mongodb82` / `{{ pr_number }}_mongotdata` au (re)deploy, ou ajouter une tâche finale d'auto-réparation (resync + `restart mongot` si mongot n'est pas healthy).
