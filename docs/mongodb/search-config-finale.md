# Configuration finale du moteur de recherche (MongoDB Search)

> Source de vérité unique de la configuration de recherche de La Bonne Alternance.
> Alignée sur le code : `shared/src/models/searchItems.model.ts`, `server/src/jobs/search/generateSearchItemsCollection.ts`, `server/src/services/search/search.service.ts`, `server/src/common/utils/mongodbUtils.ts`.
> Pour le contexte de la décision (pourquoi cette architecture), voir [analyse-search-analyzers.md](./analyse-search-analyzers.md).

---

## 1. Principe : matching ≠ affichage

La collection `search_items` agrège **3 types de documents** dans un index unique (`search_items_index`), classés par **un seul score**, affichés dans **une liste flat** côté front :

- `formation` (sub_type `formation`)
- `offre` (sub_type `offres_emploi_lba` / `offres_emploi_partenaires`)
- `recruteurs_lba` (sub_type `recruteurs_lba`) — **entreprise susceptible de recruter, pas une offre d'emploi**

Pour que le classement soit correct sur cet ensemble hétérogène, les champs **interrogés** sont **sémantiquement homogènes** entre les 3 types (un champ = un sens), distincts des champs d'affichage.

---

## 2. Schéma des champs

| Champ | Rôle | `formation` | `offre` | `recruteurs_lba` | Analyzer (string) |
|---|---|---|---|---|---|
| `title` | affichage + match secondaire | `intitule_rco` | `offer_title` | nom entreprise | `lucene.french` (+ multi `standard`) |
| `description` | texte libre (type-pur) | `contenu` | `offer_description` | **`""` (vide)** | `lucene.french` (+ multi `standard`) |
| `rome_labels` | **signal métier déterministe** | dérivé `rome_codes` | dérivé `offer_rome_codes` | dérivé `rome_codes` (rawR) | `lucene.french` (+ multi `standard`) |
| `keywords` | enrichissement Mistral (bonus) | Mistral ← contenu | Mistral ← description | Mistral ← rome_labels | `lucene.french` (+ multi `standard`) |
| `organization_name` | nom d'organisme | CFA formateur | entreprise | entreprise | **`lba_company`** (+ multi `standard`, + `token`) |

Champs de filtrage / facette (`token`) : `type`, `type_filter_label`, `sub_type`, `contract_type`, `level`, `activity_sector`.
Autres : `location` (geo), `smart_apply` (boolean), `application_count` (number), `publication_date` (date).

`rome_labels` (`string[]`) est résolu **déterministiquement** depuis les codes ROME via une `Map<code_rome, intitulé>` chargée une fois du référentiel `referentielromes` (`resolveRomeLabels` / `loadRomeLabelByCode` dans `generateSearchItemsCollection.ts`). Le recall métier ne dépend donc **plus** de Mistral.

---

## 3. Analyzers

### `lba_company` (custom — noms d'organismes)

```js
{
  name: "lba_company",
  tokenizer: { type: "standard" },
  tokenFilters: [{ type: "lowercase" }, { type: "asciiFolding" }], // PAS de stemming, PAS de stopwords
}
```

Pourquoi : `organization_name` est toujours un nom propre d'organisme (CFA / entreprise). Le stemming `lucene.french` tronquait ces noms (`"Société Générale"` → `societ`/`general`). `lba_company` minusculise et retire les accents **sans raciniser** → noms préservés (`"bnp paribas"`, `"capgemini"`).

### `lucene.french` (champs textuels métier)

`title`, `description`, `rome_labels`, `keywords` : stemming + élision + mots vides FR. Multi-analyzer `standard` conservé sur tous pour la clause synonymes.

### Synonymes `lba_synonyms`

Analyzer `lucene.standard`, source collection `search_synonyms` (seedée depuis `docs/mongodb/search-synonyms.json`). Expansion d'abréviations (ex. `ccgo` → `Chef de chantier gros oeuvre`).

---

## 4. Requête — porte de pertinence & boosting par champ

`buildTextGate` (`search.service.ts`) : une clause de couverture par terme (`buildTermCoverageClause`), combinées avec un `minimumShouldMatch` dynamique (tous ≤ 2 termes, n−1 pour 3-4, 75 % au-delà). La tokenisation retire les stopwords grammaticaux, du domaine (apprenti, alternance…) **et de diplôme** (bac, bts, cap, licence, master, pro… — recette #3 : « bac pro commerce » doit cibler « commerce », le niveau se filtre par la facette).

Voies de couverture d'un terme (boost) :

| Champ | Boost | Conditions |
|---|---|---|
| `rome_labels` | ×8 | fuzzy si terme ≥ 8 (`maxEdits: 1, prefixLength: 2`) — pas de fuzzy en dessous (« vente » ≈ « verte », « manager » ≈ « manger », recette #3) |
| `title` | ×7 | idem |
| `organization_name` | ×6 | jamais de fuzzy (noms propres : « vigile » → VIGIER) |
| `keywords` | ×5 | requête **mono-terme : recruteurs uniquement** (un keyword générique faisait entrer des offres hors sujet) ; multi-termes : tous types (le msm exige les autres termes ailleurs) |
| `autocomplete` title/rome_labels | ×3 | **mono-terme uniquement** (troncature volontaire « compta » → comptable ; en multi-termes « product » couvrait « production ») |
| synonymes `lba_synonyms` | ×6 | clause **`phrase`** (séquence exigée — en `text`, « vigile » → « agent de sécurité » laissait entrer tout doc contenant « agent ») sur `title` + `rome_labels` seulement (la clause matche aussi la requête brute : l'étendre à keywords/description rouvrirait la porte dérobée) |

Bonus de score (`should`, n'élargissent pas le result set) : phrase title/rome_labels ×10, phrase organization_name ×8, `keywords` ×3, `description` ×1.

Conséquence de l'homogénéité : un recruteur remonte sur une requête métier (`"boulanger"`) via `rome_labels`/`keywords`, **sans dépendre** de son nom d'entreprise (`title`) ni d'une description qu'il n'a pas.

### Highlight / preview

`highlight.path = ["title", "description", "rome_labels"]`. `rome_labels` inclus pour que les recruteurs (description vide) aient un preview métier.

### Tri (`buildSortStage`)

- défaut : `searchScore` desc (reflète le boost) → tie-breaks `smart_apply`, `application_count`
- `date` : `publication_date` desc
- `smart_apply` : `smart_apply` desc → score → `application_count`
- `proximity` (avec géo) : score via `near` (pivot 1 km)

Les facettes (`$searchMeta`) comptent les documents (pas de score) → le boosting est sans effet sur les counts.

---

## 5. Génération & réindexation

### Génération de la collection (`fillSearchItemsCollection`)

1. Charge `Map<code_rome, intitulé>` (`loadRomeLabelByCode`) une fois.
2. Formations / offres / recruteurs → mapping `ISearchItem` avec `rome_labels` résolu côté JS.
3. Suppression des docs absents des sources.
4. 2e passe `fillMissingKeywords` (Mistral) : source = `description`, à défaut `rome_labels` (recruteurs).

> ⚠️ Le job **conserve les docs déjà présents** (`if (existingIds.has(id)) return`). Un re-run ne backfill **pas** les nouveaux champs. Pour appliquer un changement de schéma (ex. `rome_labels`, `description` recruteur vidée) : **drop la collection `search_items`** avant régénération.

### Index de recherche (`createSearchIndexes`)

`createSearchIndexes` (`mongodbUtils.ts`) :
- index absent → `createSearchIndex`
- **index présent → `updateSearchIndex(name, definition)`** (applique tout changement d'analyzer/champ ; idempotent)

Déclenché par le job `recreateIndexes` (après `createIndexes` + `seedSearchSynonyms`).

---

## 6. Autocomplétion (Phase 3 — branche `feat/lba-3249-search-autocomplete`)

Suggestions de saisie par **préfixe**, en plus de la recherche full-text.

### Index
`title` et `rome_labels` reçoivent un type **`autocomplete`** supplémentaire (en plus du type `string`) :
```js
{ type: "autocomplete", tokenization: "edgeGram", minGrams: 3, maxGrams: 15, foldDiacritics: true }
```
`foldDiacritics: true` → `"dev"` matche `"Développeur"`.

### Endpoint
`GET /api/v1/search/suggest?q=<≥3 car.>&limit=<≤20>` → `{ suggestions: string[] }`.

- Service `suggestSearchTerms` (`search.service.ts`) : opérateur `autocomplete` sur `title` (boost ×2) + `rome_labels`, fuzzy `maxEdits:1`.
- Filtrage : seuls les intitulés **contenant réellement** la saisie (normalisée sans accents) sont renvoyés, dédupliqués, ordre de pertinence préservé.
- Rate-limit dédié (60/s).

### Front
`SearchBar.tsx` (champ métier) appelle `/v1/search/suggest` (debounce 300 ms, déclenché à ≥3 caractères) au lieu de réutiliser `/v1/search`.

> ⚠️ L'ajout du type `autocomplete` modifie la définition d'index → nécessite `updateSearchIndex` (géré par `createSearchIndexes`). Re-lancer `recreateIndexes` après déploiement.

---

### Procédure de mise à jour complète

```
1. Déployer le code (modèle + job + service).
2. Drop la collection `search_items`.
3. Lancer fillSearchItemsCollection (régénère avec rome_labels, description recruteur vide).
4. Lancer recreateIndexes (ou createSearchIndexes) → updateSearchIndex applique lba_company + rome_labels.
5. Vérifier : listSearchIndexes contient lba_company et le champ rome_labels.
```
