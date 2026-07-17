# Analyse du moteur de recherche — Constat & décision

> Ce document explique **pourquoi** la configuration de recherche a été refondue (le constat) et **quelle** architecture a été retenue.
> La configuration finale détaillée (champs, analyzers, boosting, procédure de réindexation) est dans [search-config-finale.md](./search-config-finale.md) — source de vérité.

---

## 1. Architecture de recherche

Index Atlas Search `search_items_index` sur la collection `search_items`, alimentée par `formation.model.ts` + `jobsPartners.model.ts` via le job `generateSearchItemsCollection.ts`. La collection agrège **3 types de documents** classés par **un seul score** et affichés dans **une liste flat** côté front (`SearchResultsList.tsx`, pas de filtre `sub_type`) :

- `formation`
- `offre` (vraies offres : LBA + partenaires)
- `recruteurs_lba` — **entreprise susceptible de recruter, pas une offre d'emploi**

---

## 2. Constat — surcharge sémantique des champs

À l'origine, pour « avoir du contenu et faire remonter les documents », les mêmes champs étaient remplis avec des contenus de **nature différente selon le type** :

| Champ | `formation` | `offre` | `recruteurs_lba` |
|---|---|---|---|
| `title` | `intitule_rco` | `offer_title` (poste) | **nom entreprise** |
| `description` | `contenu` | `offer_description` | **intitulés ROME joints** (hack) |
| `keywords` | Mistral ← contenu | Mistral ← description | Mistral ← ROME |
| `organization_name` | CFA formateur | nom entreprise | nom entreprise |

Un même champ ne veut donc **pas dire la même chose** selon le type. Conséquences :

1. **Classement impossible à pondérer correctement.** Booster `title` (≈ « l'intitulé du poste est le signal fort ») aide les offres mais **pénalise les recruteurs**, dont le `title` est un nom d'entreprise hors-sujet pour une requête métier. La sémantique de `title` et `description` est **inversée** entre offres et recruteurs.
2. **Preview / highlight incohérent.** Surligner `description` pour un recruteur affiche une liste d'intitulés ROME séparés par des virgules.
3. **Recall fragile.** Le signal métier des recruteurs vivait dans `description` (hack) + `keywords` (Mistral, **non déterministe**) : si l'enrichissement Mistral échoue, le recruteur devient difficile à retrouver.

Par ailleurs, `organization_name` était analysé en `lucene.french` : le stemming tronquait des noms propres d'entreprises (`"Société Générale"` → `societ`/`general`).

---

## 3. Décision retenue — couche matching propre

Principe : **séparer la couche matching (champs interrogés, homogènes) de la couche affichage**.

1. **`description` redevient type-pure** : vraie description (formation/offre) ou **vide** (recruteur). Plus de ROME fourrés dedans.
2. **Nouveau champ `rome_labels`** (`string[]`) : signal métier **déterministe**, dérivé des codes ROME pour les 3 types via le référentiel `referentielromes`. Indépendant de Mistral → recall robuste.
3. **`keywords`** reste un enrichissement Mistral (bonus, plus le socle du recall).
4. **`title`** = heading d'affichage + match secondaire. **`organization_name`** = nom d'organisme, analysé par un analyzer dédié **`lba_company`** (minuscules + sans accents, **sans stemming**).
5. **Boosting par champ uniforme** (champs désormais homogènes) : `rome_labels ×8`, `title ×7`, `keywords ×5`, `organization_name ×3`, `description ×2`.

Résultat : un recruteur remonte sur une requête métier (`"boulanger"`) via `rome_labels`/`keywords`, sans dépendre de son nom d'entreprise ni d'une description absente ; le boosting est correct pour les 3 types ; les noms d'entreprises ne sont plus racinisés.

---

## 4. Pistes ultérieures (non implémentées)

- **Autocomplétion** : type `autocomplete` (edgeGram + foldDiacritics) sur `title` / `organization_name` + endpoint dédié `/v1/search/suggest` + intégration front (debounce, ≥3 caractères). Impacte la taille de l'index — à arbitrer produit.
- **Affichage `rome_labels` en tags** sur la carte recruteur (`SearchHitCard.tsx`).
- **Calibrage des poids de boosting** : ajustables sans reindex (changement requête uniquement).

---

*Pour le détail exhaustif de la configuration en place, voir [search-config-finale.md](./search-config-finale.md).*
