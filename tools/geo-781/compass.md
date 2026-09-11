# Chiffres de production à relever dans MongoDB Compass

Onglet Aggregations de la collection indiquée, coller le pipeline, copier l'objet résultat.
Chaque pipeline renvoie **un seul document** avec un champ `mesure` qui l'identifie : les
résultats peuvent être collés tels quels, dans n'importe quel ordre.

## Avant déploiement

### `search_items` — volume par type et part sans géopoint

```js
[
  { $group: { _id: "$type", total: { $sum: 1 }, sans_location: { $sum: { $cond: [{ $ifNull: ["$location", false] }, 0, 1] } } } },
  { $group: { _id: null, total: { $sum: "$total" }, par_type: { $push: { type: "$_id", total: "$total", sans_location: "$sans_location" } } } },
  { $project: { _id: 0, mesure: "search_items_volume", total: 1, par_type: 1 } }
]
```

### `jobs_partners` — résolution du département des offres actives

Jointure sur le référentiel : dit directement combien d'offres auront `departement_code: null`
(CP inconnu) et combien dépendent du géopoint pour trancher (CP à cheval).

```js
[
  { $match: { offer_status: "Active" } },
  { $lookup: { from: "referentiel.communes", localField: "workplace_address_zipcode", foreignField: "codesPostaux", as: "communes" } },
  { $project: {
      zipcode_absent: { $in: ["$workplace_address_zipcode", [null, ""]] },
      zipcode_malforme: { $and: [{ $ne: ["$workplace_address_zipcode", null] }, { $not: { $regexMatch: { input: { $ifNull: ["$workplace_address_zipcode", ""] }, regex: /^[0-9]{5}$/ } } }] },
      nb_departements: { $size: { $setUnion: ["$communes.codeDepartement"] } },
      sans_geopoint: { $eq: [{ $ifNull: ["$workplace_geopoint", null] }, null] }
  } },
  { $group: {
      _id: null,
      total: { $sum: 1 },
      zipcode_absent: { $sum: { $cond: ["$zipcode_absent", 1, 0] } },
      zipcode_malforme: { $sum: { $cond: ["$zipcode_malforme", 1, 0] } },
      cp_inconnu_du_referentiel: { $sum: { $cond: [{ $and: [{ $not: "$zipcode_absent" }, { $eq: ["$nb_departements", 0] }] }, 1, 0] } },
      cp_a_cheval: { $sum: { $cond: [{ $gt: ["$nb_departements", 1] }, 1, 0] } },
      cp_a_cheval_sans_geopoint: { $sum: { $cond: [{ $and: [{ $gt: ["$nb_departements", 1] }, "$sans_geopoint"] }, 1, 0] } },
      resolu_directement: { $sum: { $cond: [{ $eq: ["$nb_departements", 1] }, 1, 0] } }
  } },
  { $project: { _id: 0, mesure: "jobs_partners_resolution_departement", total: 1, resolu_directement: 1, cp_a_cheval: 1, cp_a_cheval_sans_geopoint: 1, cp_inconnu_du_referentiel: 1, zipcode_absent: 1, zipcode_malforme: 1 } }
]
```

Lecture : `resolu_directement + cp_a_cheval - cp_a_cheval_sans_geopoint` = offres qui auront un
code ; le reste tombe à `null`.

### `formationcatalogues` — résolution du département des formations

```js
[
  { $lookup: { from: "referentiel.communes", localField: "code_commune_insee", foreignField: "code", as: "par_insee" } },
  { $lookup: { from: "referentiel.communes", localField: "code_postal", foreignField: "codesPostaux", as: "par_cp" } },
  { $project: {
      insee_absent: { $in: ["$code_commune_insee", [null, ""]] },
      insee_resolu: { $gt: [{ $size: "$par_insee" }, 0] },
      cp_absent: { $in: ["$code_postal", [null, ""]] },
      cp_nb_departements: { $size: { $setUnion: ["$par_cp.codeDepartement"] } },
      sans_geopoint: { $eq: [{ $ifNull: ["$lieu_formation_geopoint", null] }, null] }
  } },
  { $group: {
      _id: null,
      total: { $sum: 1 },
      resolu_par_insee: { $sum: { $cond: ["$insee_resolu", 1, 0] } },
      insee_absent: { $sum: { $cond: ["$insee_absent", 1, 0] } },
      insee_inconnu_du_referentiel: { $sum: { $cond: [{ $and: [{ $not: "$insee_absent" }, { $not: "$insee_resolu" }] }, 1, 0] } },
      repli_cp_resolu: { $sum: { $cond: [{ $and: [{ $not: "$insee_resolu" }, { $eq: ["$cp_nb_departements", 1] }] }, 1, 0] } },
      repli_cp_a_cheval_sans_geopoint: { $sum: { $cond: [{ $and: [{ $not: "$insee_resolu" }, { $gt: ["$cp_nb_departements", 1] }, "$sans_geopoint"] }, 1, 0] } },
      irresolu: { $sum: { $cond: [{ $and: [{ $not: "$insee_resolu" }, { $eq: ["$cp_nb_departements", 0] }] }, 1, 0] } }
  } },
  { $project: { _id: 0, mesure: "formations_resolution_departement", total: 1, resolu_par_insee: 1, repli_cp_resolu: 1, repli_cp_a_cheval_sans_geopoint: 1, irresolu: 1, insee_absent: 1, insee_inconnu_du_referentiel: 1 } }
]
```

### `referentiel.communes` — codes postaux à cheval sur plusieurs départements

Le seul cas où la dérivation dépend du géopoint. Renvoie le compte et la liste.

```js
[
  { $unwind: "$codesPostaux" },
  { $group: { _id: "$codesPostaux", departements: { $addToSet: "$codeDepartement" }, communes: { $push: "$nom" } } },
  { $match: { "departements.1": { $exists: true } } },
  { $sort: { _id: 1 } },
  { $group: { _id: null, nb_cp_a_cheval: { $sum: 1 }, liste: { $push: { cp: "$_id", departements: "$departements", communes: "$communes" } } } },
  { $project: { _id: 0, mesure: "referentiel_cp_a_cheval", nb_cp_a_cheval: 1, liste: 1 } }
]
```

### `referentiel.communes` — fraîcheur et complétude du référentiel

Le cron tourne le dimanche à 15 h. Un référentiel incomplet fait tomber des items à `null`.

```js
[
  { $group: {
      _id: null,
      nb_communes: { $sum: 1 },
      sans_centre: { $sum: { $cond: [{ $eq: [{ $ifNull: ["$centre", null] }, null] }, 1, 0] } },
      sans_code_postal: { $sum: { $cond: [{ $eq: [{ $size: { $ifNull: ["$codesPostaux", []] } }, 0] }, 1, 0] } },
      departements: { $addToSet: "$codeDepartement" },
      regions: { $addToSet: "$codeRegion" }
  } },
  { $project: { _id: 0, mesure: "referentiel_communes_completude", nb_communes: 1, sans_centre: 1, sans_code_postal: 1, nb_departements: { $size: "$departements" }, nb_regions: { $size: "$regions" } } }
]
```

Attendu : ~34 900 communes, 101 départements, 18 régions.

## Après déploiement

### `search_items` — part résolue par type

`champ_absent` > 0 : des items n'ont pas encore été reconstruits depuis le déploiement.

```js
[
  { $group: {
      _id: "$type",
      total: { $sum: 1 },
      champ_absent: { $sum: { $cond: [{ $eq: [{ $type: "$departement_code" }, "missing"] }, 1, 0] } },
      non_resolu: { $sum: { $cond: [{ $eq: ["$departement_code", null] }, 1, 0] } },
      resolu: { $sum: { $cond: [{ $eq: [{ $type: "$departement_code" }, "string"] }, 1, 0] } }
  } },
  { $group: { _id: null, par_type: { $push: { type: "$_id", total: "$total", resolu: "$resolu", non_resolu: "$non_resolu", champ_absent: "$champ_absent" } } } },
  { $project: { _id: 0, mesure: "search_items_resolution_post_deploiement", par_type: 1 } }
]
```

### `search_items` — distribution par département

```js
[
  { $match: { departement_code: { $type: "string" } } },
  { $group: { _id: "$departement_code", total: { $sum: 1 } } },
  { $sort: { _id: 1 } },
  { $group: { _id: null, nb_departements_representes: { $sum: 1 }, par_departement: { $push: { departement: "$_id", total: "$total" } } } },
  { $project: { _id: 0, mesure: "search_items_par_departement", nb_departements_representes: 1, par_departement: 1 } }
]
```

Attendu : 101 départements représentés. Un code absent de la liste alors que le département a
des offres pointe un trou dans le référentiel.

### `search_items` — état de l'index Atlas Search

Tant que `status` n'est pas `READY`, un `equals` sur `departement_code` renvoie zéro résultat en
silence : ne pas activer la sélection UI avant.

```js
[
  { $listSearchIndexes: {} },
  { $project: { _id: 0, mesure: "search_items_index_status", name: 1, status: 1, queryable: 1, a_les_nouveaux_champs: { $and: [{ $ne: [{ $ifNull: ["$latestDefinition.mappings.fields.departement_code", null] }, null] }, { $ne: [{ $ifNull: ["$latestDefinition.mappings.fields.region_code", null] }, null] }] } } }
]
```

### Contrôle croisé géométrique

À faire avec `node tools/geo-781/bench.mjs "<département>"` plutôt qu'en Compass : la ligne
`4-code` doit afficher 0 % hors périmètre face au contour officiel.
