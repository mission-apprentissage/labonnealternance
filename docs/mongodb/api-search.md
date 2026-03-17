# API Search — Référence d'intégration

Endpoint de recherche unifié utilisant **MongoDB Search** (mongot / Lucene) sur la collection `algolia`.

## Endpoint

```
GET /api/v1/search
```

## Paramètres de requête

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `q` | `string` | — | Texte libre (fuzzy, analyse française, 1 typo toléré) |
| `type` | `string` | — | `"offre"` ou `"formation"` |
| `type_filter_label` | `string` | — | Libellé de type pour l'affichage des filtres |
| `contract_type` | `string \| string[]` | — | Ex: `"Apprentissage"` ou `["Apprentissage","Contrat pro"]` |
| `level` | `string` | — | Niveau européen de diplôme : `"3"` à `"7"` |
| `activity_sector` | `string` | — | Secteur d'activité |
| `organization_name` | `string` | — | Filtre par nom d'entreprise (exact) |
| `latitude` | `number` | — | Latitude WGS84 |
| `longitude` | `number` | — | Longitude WGS84 |
| `radius` | `number` | `30` | Rayon de recherche en km |
| `page` | `number` | `0` | Index de page (commence à 0) |
| `hitsPerPage` | `number` | `20` | Résultats par page (max `100`) |

## Structure de réponse

```json
{
  "hits": [ /* tableau de résultats IAlgolia */ ],
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
  }
}
```

## Champs d'un résultat (`IAlgolia`)

| Champ | Type | Description |
|---|---|---|
| `objectID` | `string` | Identifiant unique |
| `url_id` | `string` | Slug pour construire l'URL de détail |
| `type` | `string` | `"offre"` ou `"formation"` |
| `type_filter_label` | `string` | Label lisible pour l'affichage des filtres |
| `sub_type` | `string` | Sous-catégorie |
| `contract_type` | `string[]` | Types de contrat |
| `publication_date` | `Date` (ISO 8601) | Date de publication |
| `smart_apply` | `boolean` | `true` si la candidature rapide est disponible |
| `application_count` | `number` | Nombre de candidatures déjà reçues |
| `title` | `string` | Titre de l'offre ou de la formation |
| `description` | `string` | Description |
| `address` | `string` | Adresse complète |
| `_geoloc` | `{ lat: number, lng: number }` | Coordonnées géographiques (format Algolia) |
| `location` | `{ type: "Point", coordinates: [lng, lat] }` | Coordonnées GeoJSON (MongoDB Search) |
| `organization_name` | `string` | Nom de l'entreprise |
| `level` | `string \| null` | Niveau de diplôme visé |
| `activity_sector` | `string \| null` | Secteur d'activité |
| `keywords` | `string[]` | Mots-clés indexés |

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

# Pagination
GET /api/v1/search?q=web&page=2&hitsPerPage=10
```

## Notes d'intégration frontend

- **Pagination** : utiliser `page` (0-based) et `nbPages` pour les contrôles, afficher `nbHits` comme total
- **Facettes** : les compteurs permettent de désactiver les options de filtre sans résultats
- **contract_type** : peut être passé plusieurs fois dans la query string (`?contract_type=Apprentissage&contract_type=Contrat+pro`)
- **Géo** : les paramètres `latitude`, `longitude` et `radius` sont indépendants du texte — entièrement combinables
- **Lien de détail** : construire l'URL depuis `url_id` et `type` (ex: `/offre/{url_id}`)
- **`smart_apply`** : afficher le badge "Postuler rapidement" lorsque `true`
- **Tri** : les résultats sont triés par pertinence, avec boost pour `smart_apply` et pénalité pour les offres très sollicitées (`application_count`)

## Architecture technique

- **Collection** : `algolia` (MongoDB)
- **Index de recherche** : `algolia_search` (mongot / Lucene)
- **Champs full-text** : `title`, `description`, `keywords`, `organization_name` (analyseur `lucene.french`)
- **Champs filtrables** : `type`, `type_filter_label`, `sub_type`, `contract_type`, `level`, `activity_sector`, `organization_name`
- **Géosearch** : champ `location` (GeoJSON Point), rayon en mètres dans l'opérateur `geoWithin`
- **Facettes** : calculées via `$searchMeta` en parallèle de la requête principale
