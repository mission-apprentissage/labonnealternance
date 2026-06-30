# Configuration finale du moteur de recherche (MongoDB Search)

> Source de vérité unique de la configuration de recherche de La Bonne Alternance.
> Alignée sur le code : `shared/src/models/algolia.model.ts`, `server/src/jobs/algolia/generateAlgoliaCollection.ts`, `server/src/services/search/search.service.ts`, `server/src/common/utils/mongodbUtils.ts`.
> Pour le contexte de la décision (pourquoi cette architecture), voir [analyse-search-analyzers.md](./analyse-search-analyzers.md).

---

## 1. Principe : matching ≠ affichage

La collection `algolia` agrège **3 types de documents** dans un index unique (`algolia_search`), classés par **un seul score**, affichés dans **une liste flat** côté front :

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

`rome_labels` (`string[]`) est résolu **déterministiquement** depuis les codes ROME via une `Map<code_rome, intitulé>` chargée une fois du référentiel `referentielromes` (`resolveRomeLabels` / `loadRomeLabelByCode` dans `generateAlgoliaCollection.ts`). Le recall métier ne dépend donc **plus** de Mistral.

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

## 4. Requête — boosting par champ

`buildTextClauses` (`search.service.ts`) génère une clause `text` par champ, combinées en `should` (`minimumShouldMatch: 1`), avec `fuzzy: { maxEdits: 1, prefixLength: 1 }` :

| Champ | Boost | Justification |
|---|---|---|
| `rome_labels` | ×8 | Signal métier déterministe, homogène aux 3 types |
| `title` | ×7 | Intitulé poste/formation (fort) ; nom entreprise pour recruteurs |
| `keywords` | ×5 | Enrichissement Mistral |
| `organization_name` | ×3 | Recherche par nom d'organisme (`lba_company`) |
| `description` | ×2 | Contexte (offres/formations) — vide pour recruteurs |
| synonymes (`lba_synonyms`) | — | Clause `text` multi `standard`, expansion d'abréviations |

`prefixLength: 1` : 1er caractère exact → réduit le bruit du fuzzy.

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

### Génération de la collection (`fillAlgoliaCollection`)

1. Charge `Map<code_rome, intitulé>` (`loadRomeLabelByCode`) une fois.
2. Formations / offres / recruteurs → mapping `IAlgolia` avec `rome_labels` résolu côté JS.
3. Suppression des docs absents des sources.
4. 2e passe `fillMissingKeywords` (Mistral) : source = `description`, à défaut `rome_labels` (recruteurs).

> ⚠️ Le job **conserve les docs déjà présents** (`if (existingIds.has(id)) return`). Un re-run ne backfill **pas** les nouveaux champs. Pour appliquer un changement de schéma (ex. `rome_labels`, `description` recruteur vidée) : **drop la collection `algolia`** avant régénération.

### Index de recherche (`createSearchIndexes`)

`createSearchIndexes` (`mongodbUtils.ts`) :
- index absent → `createSearchIndex`
- **index présent → `updateSearchIndex(name, definition)`** (applique tout changement d'analyzer/champ ; idempotent)

Déclenché par le job `recreateIndexes` (après `createIndexes` + `seedSearchSynonyms`).

### Procédure de mise à jour complète

```
1. Déployer le code (modèle + job + service).
2. Drop la collection `algolia`.
3. Lancer fillAlgoliaCollection (régénère avec rome_labels, description recruteur vide).
4. Lancer recreateIndexes (ou createSearchIndexes) → updateSearchIndex applique lba_company + rome_labels.
5. Vérifier : listSearchIndexes contient lba_company et le champ rome_labels.
```
