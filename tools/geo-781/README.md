# Emprise administrative : banc d'essai des 3 solutions

Contexte : issue [BaseAdresseNationale/ban-plateforme#781](https://github.com/BaseAdresseNationale/ban-plateforme/issues/781).

Une saisie « Bretagne » ou « dans le Nord » doit restreindre la recherche à une région ou un
département. Le géocodeur Géoplateforme sait résoudre la saisie (index `poi`, `category=région`,
code renvoyé dans `citycode`), mais ne renvoie pas d'emprise : un centroïde, ou le contour complet
via `returntruegeometry` (46 Ko pour un département, 416 Ko pour la Bretagne).

Ce dossier sert à mesurer ce que chaque stratégie ramène vraiment. Il est jetable : rien ici
n'est importé par le serveur ni par l'UI.

## Les stratégies comparées

| | Stratégie | Emprise | Coût à la requête | Dans l'application |
|---|---|---|---|---|
| 1 | rayon (avant) | 51 à 82 % de bruit | faible | remplacé quand `admin_area` est posé |
| 2 | bbox précalculée | 42 à 70 % de bruit | faible | non, banc seulement |
| 3 | contour officiel | exacte | 46 à 416 Ko de géométrie par requête | non, banc seulement |
| 4 | code indexé (retenu) | exacte | `equals` sur un `token`, le moins cher possible | oui |

La 4 est la solution retenue : `departement_code` et `region_code` sont dérivés à la construction
des items (`server/src/services/search/search-items-admin-codes.ts`) depuis le référentiel
`referentiel.communes`, et indexés en `token`. À la requête, `admin_area=departement:44` devient
`{ equals: { path: "departement_code", value: "44" } }`. Aucune géométrie, aucun appel réseau.

Dérivation, du plus sûr au moins sûr (chiffres de production du 2026-09-11 dans compass.md) :

1. code INSEE de la commune (formations, 92,7 %) ; les arrondissements de Paris, Lyon et
   Marseille sont ramenés à leur commune, le référentiel ne les connaît pas ;
2. code postal connu du référentiel (offres, 99,4 %) ; un CP à cheval sur deux départements
   (16 CP, 402 offres) est tranché par la commune du CP la plus proche du géopoint ;
3. CP inconnu du référentiel mais de forme départementale (CEDEX, 75000, 13000) : département
   lu dans le code, Corse exclue (2A/2B), Saint-Martin et Saint-Barthélemy exclus (préfixe 971) ;
4. géopoint seul (1 185 offres sans CP) : commune dont la bbox contient le point, la plus proche
   en cas de recouvrement. Hors de toute bbox, `null`.

Attendu après déploiement : moins de 0,05 % d'items à `null`, essentiellement Saint-Martin,
Saint-Barthélemy et Saint-Pierre-et-Miquelon, qui ne sont pas des départements.

## Tester en local

Prérequis : services démarrés (`yarn services:start` lance mongodb + mongot), `server/.env`
généré par `yarn setup` (il porte `LBA_MONGODB_URI`), une base locale avec des `jobs_partners`
et des `formationcatalogues`.

`yarn cli` exécute `server/dist` : rebuild `shared` et `server` d'abord, sinon la CLI tourne sur
l'ancien code sans les nouveaux champs.

```bash
yarn workspace shared build && yarn workspace server build

# 1. Référentiel communes (~35 000 communes, une trentaine de secondes ; inutile s'il est déjà là)
yarn cli referentiel:commune:import

# 2. Index Atlas Search : applique la nouvelle définition (updateSearchIndex, idempotent),
#    mongot reconstruit en arrière-plan
yarn cli indexes:recreate

# 3. Peuple departement_code / region_code sur tous les items, existants compris
yarn cli fillSearchItemsCollection

# 4. Attendre status READY avant de chercher. La variable n'est pas exportée dans le shell :
#    on la lit dans server/.env (la commande tourne dans le conteneur, localhost y est le bon hôte)
docker compose exec -T mongodb mongosh "$(grep -m1 '^LBA_MONGODB_URI=' server/.env | cut -d= -f2- | tr -d '"')" --quiet --eval \
  'db.search_items.aggregate([{ $listSearchIndexes: {} }]).forEach(i => print(i.name, i.status, i.queryable))'
```

Puis `yarn dev`, et dans la barre de recherche taper « Bretagne » ou « Nord » : la région ou le
département remonte en tête des suggestions, l'URL porte `admin_area=region:53`, et l'API reçoit
le filtre. Sans sélection d'une entité administrative, rien ne change.

Vérifier directement l'API :

```bash
curl -s "http://localhost:5001/api/v1/search?admin_area=departement:44&hitsPerPage=3" | jq '.nbHits, [.hits[].address]'
curl -s "http://localhost:5001/api/v1/search?admin_area=region:53&mode=formations&hitsPerPage=3" | jq '.nbHits, [.hits[].address]'
```

`nbHits: 0` alors que la base a des offres dans le 44 : soit l'index n'est pas `READY` (étape 4),
soit les codes ne sont pas peuplés (étape 3), à distinguer avec `search_items_resolution_post_deploiement`
dans compass.md.

## Mesurer

```bash
node tools/geo-781/bench.mjs "Bretagne"
```

Sans base : compare les emprises entre elles (aires, rayon nécessaire, dépassement du plafond
de 200 km de l'API v3).

```bash
export LBA_MONGODB_URI="$(grep -m1 '^LBA_MONGODB_URI=' server/.env | cut -d= -f2- | tr -d '"')"
node tools/geo-781/bench.mjs "Nord" --limit 5000 --diff
```

`--diff` liste les items dans le contour sans le code attendu, et ceux qui ont le code mais un
géopoint hors du contour : c'est là qu'on lit si un écart vient de la source (CP et géopoint qui
se contredisent) ou du résolveur.

Avec base : exécute les quatre requêtes `$search` sur `search_items` et compte ce que chacune
ramène. La vérité terrain est l'appartenance au contour officiel vérifiée point par point,
pas la stratégie elle-même. Sortie : ramenés, dans le périmètre, hors périmètre, rappel, temps.
La ligne `4-code` doit être à 0 % hors périmètre et 100 % de rappel face à `3-contour`.

Saisies intéressantes : `Nord` et `Somme` (homonymie commune/département), `Bretagne` (région
très concave, la bbox y est mauvaise), `Nouvelle-Aquitaine` (261 km, au-dessus du plafond),
`Corse-du-Sud`, `La Réunion`.

## Régénérer les bbox du banc

```bash
node tools/geo-781/build-bbox.mjs > tools/geo-781/admin-areas-bbox.json
```

119 entités, ~40 secondes, 25 Ko. Le script sort en code 1 si une entité manque ou si le code
renvoyé ne correspond pas à celui attendu. Ce fichier ne sert qu'au banc (stratégie 2) ; le
serveur n'en dépend plus depuis que le code est indexé.

## Ce qui est branché dans l'application

- `shared/src/models/search-items.model.ts` : `departement_code`, `region_code`, indexés `token`.
- `server/src/services/search/search-items-admin-codes.ts` : chargement du référentiel et
  résolution INSEE → CP → géopoint. Testé sur les cas ambigus en premier.
- `server/src/services/search/search-items.service.ts` : les trois builders posent les codes ;
  projections étendues à `code_commune_insee` et `workplace_address_zipcode`.
- `server/src/services/geo-administrative/admin-area.ts` : parsing de `admin_area` et clause `equals`.
- `search.service.ts` : `buildGeoClause` unique pour la recherche et les facettes ; `admin_area`
  prime sur le cercle.
- `shared/src/routes/search.routes.ts` : paramètre `admin_area` validé par regex.
- UI : `searchAddress(…, withAdminAreas)` ajoute l'index `poi` ; la suggestion porte `adminArea`,
  transmis jusqu'à l'URL (`admin_area`) puis à l'API. L'élargissement automatique du rayon est
  désactivé quand une emprise est posée.

## Déployer dans le bon ordre

1. Déployer : `updateSearchIndex` est appliqué au démarrage, mongot reconstruit l'index en
   arrière-plan. Vérifier `status: READY` avec `[{ $listSearchIndexes: {} }]` (cf. compass.md).
2. Peupler les codes : `yarn cli fillSearchItemsCollection` (ou attendre le nightly de 6 h).
   Le job réécrit aussi les items déjà présents : les nouveaux champs sont dans son bloc de
   backfill. Tant que ce n'est pas fait, `equals` renvoie zéro résultat en silence.
3. Vérifier la part de `departement_code: null` par type (compass.md, section après déploiement).
4. Mesurer : `node tools/geo-781/bench.mjs "Nord"`, la ligne 4-code doit être à 0 % hors périmètre.

## Limites connues

- Les tests de pertinence du moteur sont conditionnés à `SEARCH_RELEVANCE_TESTS=true` et à une
  base peuplée : la non-régression du filtre géo n'est pas couverte automatiquement.
- Quatre entités dépassent le plafond de 200 km de l'API v3 : Nouvelle-Aquitaine (261 km),
  Occitanie (228), Auvergne-Rhône-Alpes (213), Guyane (244). C'est la raison pour laquelle le
  rayon ne pouvait pas être la solution générale.
- `search_queries` (log des requêtes) n'enregistre pas encore `admin_area` : la télémétrie ne
  distingue pas une recherche par département d'une recherche sans lieu.
- Les items dont la commune n'est pas résolue (CP inconnu du référentiel, CP à cheval sans
  géopoint) ont `departement_code: null` et sortent du filtre par emprise. Ils restent trouvables
  par point + rayon. La part exacte est à relever en production (compass.md).
