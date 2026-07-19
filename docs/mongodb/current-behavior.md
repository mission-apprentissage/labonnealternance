# Comportement actuel — `/v1/search` & pages POC `/search/*`

> État du POC de recherche MongoDB Search (mongot) au-dessus de la collection `search_items`.
> Couvre : le **tri** des résultats, le champ **distance**, la **géo**, et le fonctionnement de la page **`/search/split`**.

---

## 1. Tri des résultats (`/v1/search`)

Le tri est **configurable** via le paramètre `sort` (`buildSortStage` / `buildCompoundOperator` dans [`search.service.ts`](../../server/src/services/search/search.service.ts)). Valeurs possibles : `proximity`, `date`, `applications`, `start_date` — sinon tri par défaut. (Le tri `smart_apply` a été **retiré** : « Candidature simplifiée » est devenu un filtre.)

| `sort` | Étape de tri appliquée |
|---|---|
| _(absent, défaut)_ | `searchScore` desc, puis `smart_apply` asc (non-smart d'abord), puis `application_count` asc (moins candidatées d'abord) |
| `date` | `is_algo_company` asc (recruteurs algo relégués en fin), puis `publication_date` desc (plus récent d'abord) ; docs sans vraie date de publication écartés |
| `applications` | `application_count` asc (moins candidatées d'abord), puis `searchScore` desc ; docs sans compteur écartés |
| `start_date` | `start_date` asc (démarrages les plus proches d'abord), puis `searchScore` desc ; docs sans date de début écartés |
| `proximity` (+ géo) | tri par `searchScore` desc, le score étant **fourni par l'opérateur `near`** sur `location` (pivot 1 km) → **plus proche d'abord**. Le texte `q` bascule alors en `filter`. |

> `proximity` n'a d'effet qu'avec une géolocalisation (`latitude`/`longitude`). Sans géo, on retombe sur le tri par défaut.

### ⚠️ Tri par défaut sans texte (`q` absent)

Quand il n'y a **pas de `q`** (cas de `/search/split` tant qu'aucun métier n'est saisi) **et** que le tri reste au défaut, le `compound` ne contient que des clauses **`filter`** qui **ne contribuent pas au score** → `searchScore` est **constant**. Le tri se résume alors à `smart_apply` puis `application_count`. Les tris explicites `date` et `proximity` restent eux pleinement opérants.

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
| `/search/split` | Page mono-colonne (bandeau recherche + chips + liste de cartes) | Redesign actif |
| ~~split layout~~ | Vue scindée liste/détail (panneaux `SearchDetailPanel` & co) | **Abandonnée** (retour aux cartes + page détail, comme le legacy) |
| ~~`/search/filter-only`~~ | Variante « une ligne » sans champ Métier | **Supprimée** (non retenue) |
| ~~`/search`~~ | Ancienne page non scindée | **Supprimée** |

### Plomberie

- **État piloté par l'URL** : `ISearchPageParams` + `buildSearchUrl`/`parseSearchPageParams` ([`search.params.utils.ts`](../../ui/app/search/_utils/search.params.utils.ts)). `buildSearchUrl` pointe par défaut vers `/search/split`. Nouveaux params : `mode` (type de recherche), `start_date`, `urgent`, `handi`, `smart_apply`, `is_algo_company`. Le param `selected` (split) a été retiré.
- **Données + pagination** : `useSearchResults` ([`useSearchResults.ts`](../../ui/app/search/_hooks/useSearchResults.ts)) — TanStack `useInfiniteQuery`, pagination par `pageParam`, chargement à la demande via le **bouton « Voir plus de résultats »** (RGAA — [`SearchResultsList.tsx`](../../ui/app/search/_components/SearchResultsList.tsx)).
- **Type de recherche** : `SearchTypeRechercheSelect` (Emplois uniquement [défaut] / Formations uniquement / Emplois avec formation incluse) → param `mode`. Un changement de mode **réinitialise les filtres** (et le tri s'il n'existe pas dans le nouveau mode).
- **Filtres** : `SearchFilterChip` (chips pill + poppers, application immédiate), rangée conditionnée par le mode ([`SearchFilters.tsx`](../../ui/app/search/_components/SearchFilters.tsx)) — Type d'offres (`is_algo_company`), Date de début (`start_date`, une date future désactive « Recrutement urgent »), Niveau (mono-choix, sans « Indifférent »), Type de contrat, Employeur handi-accueillant (compteur `counts.is_disabled_elligible`), Recrutement urgent (`start_type=des_que_possible`), Candidature simplifiée (`smart_apply`) ; mode Formations : Niveau + Formations à distance. Lien « Réinitialiser les filtres » (visible si filtres actifs, ne touche ni q/lieu/mode ni le tri).
- **Cartes** : `SearchHitCard` au rendu legacy (Card DSFR, badges via les composants feuilles `Tag*`, distance, date de publication, compteur de candidatures, encart « déjà postulé » via `ItemDetailApplicationsStatus` — clés localStorage partagées avec le legacy). Navigation vers la page détail via `buildHitDetailUrl`.
- **Tri** : `SearchSortSelect` (label « Trier par » au-dessus) : Les plus pertinentes / Proximité (désactivée sans géo) / Les offres les plus récentes / Les offres avec le moins de candidatures / Date de début de contrat. Mode Formations : pertinence + proximité seulement. Compteur « X résultats » à droite de la ligne de tri.
- **État vide** : illustration legacy (`dosearch.svg`) + message, affiché seulement après épuisement de l'auto-rayon (100 km).
- **Sortie du nouveau moteur** : lien « Sortir du nouveau moteur de recherche » → `/recherche` **vierge** (aucune traduction de params).
- **Mobile** : header burger DSFR (`PublicHeader`) + 2 boutons sticky (« Modifier la recherche » / « Filtrer ») ouvrant des panneaux plein écran — refonte (barre résumé + modales) prévue au lot mobile. Bascule desktop/mobile en **CSS breakpoints (`lg` 992px)**, **pas de `useMediaQuery`** (évite le flash d'hydratation).
- **Footer** : `Footer` DSFR rendu sous la page.

### Rayon automatique

- **Le champ rayon/distance est retiré de l'UI.**
- Défaut `radius = 20` km. À chaque **nouveau lieu**, on repart de **20**.
- [`useAutoRadius`](../../ui/app/search/_hooks/useAutoRadius.ts) : si un lieu est défini et que la recherche renvoie **0 résultat**, élargit le rayon par **paliers de 20 km jusqu'à 100** (20 → 40 → … → 100). Le bouton « Voir plus de résultats » gère ensuite le chargement progressif.

---

## Limitations connues

- **Tri par défaut sans `q`** (cf. §1) : ni « plus proche » ni « plus récent » d'abord. Les tris explicites `proximity` et `date` lèvent cette limite, mais ne sont appliqués que si l'utilisateur les sélectionne.
- Le `radius` par défaut de l'API reste `30` ([`search.routes.ts`](../../shared/src/routes/search.routes.ts)) ; côté front les vues forcent `20` et l'auto-élargissement.
- Données legacy : un document sans `location` (non régénéré par `fillSearchItemsCollection`) sort des recherches géo et a une `distance` nulle (plus de job de backfill).
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
