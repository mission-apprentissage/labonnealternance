# Expérience — Baseline boosting (sans Phase 3 / autocomplétion)

**Date :** 2026-06-06
**Auteur :** mission apprentissage — refonte couche matching search
**Statut :** baseline de référence (avant autocomplétion)

---

## 1. Objectif

Mesurer la qualité du classement de la recherche après la refonte « couche matching propre » (voir [../mongodb/search-config-finale.md](../mongodb/search-config-finale.md)), et constituer une **référence** pour comparer ultérieurement avec/sans l'autocomplétion (Phase 3).

Questions évaluées :
1. Les bons documents remontent-ils en tête sur des requêtes métier courantes ?
2. Le signal métier déterministe `rome_labels` est-il présent et utile ?
3. Quels cas de bruit ou de manque subsistent ?

## 2. Environnement

| Élément | Valeur |
|---|---|
| Endpoint | `GET /api/v1/search` (serveur local, `:5001`) |
| Index | `algolia_search` (collection `algolia`, régénérée avec `rome_labels`) |
| Paramètres | `page=0`, `hitsPerPage=20`, **sans** filtre ni géo |
| Analyzers | `lucene.french` (title/description/rome_labels/keywords) + multi `standard` ; `lba_company` (organization_name) |
| Synonymes | `lba_synonyms` (collection `search_synonyms`) |
| Fuzzy | `maxEdits: 1`, `prefixLength: 1` |

**Boosting par champ testé :**

| Champ | Boost |
|---|---|
| `rome_labels` | ×8 |
| `title` | ×7 |
| `keywords` | ×5 |
| `organization_name` | ×3 |
| `description` | ×2 |
| synonymes (`lba_synonyms`) | clause `text` multi `standard` |

## 3. Protocole

```bash
BASE="http://localhost:5001/api/v1/search"
for Q in "boulanger" "developpeur" "marketing" "service à la personne"; do
  curl -s -G "$BASE" --data-urlencode "q=$Q" --data-urlencode "page=0" --data-urlencode "hitsPerPage=20" -o raw_<slug>.json
done
```

Indicateurs relevés par requête : `nbHits`, couverture `rome_labels` (hits avec `rome_labels` non vide / 20), et le **top 10** classé (sub_type, title, organization_name, rome_labels, matched_words).

## 4. Résultats

### Synthèse

| Requête | nbHits | `rome_labels` (top 20) | Verdict top 10 |
|---|---|---|---|
| `boulanger` | 13 644 | 20/20 | ✅ excellent |
| `developpeur` | 3 964 | 20/20 | ✅ excellent |
| `marketing` | 25 315 | 20/20 | ✅ bon |
| `service à la personne` | 65 112 | 13/20 | ⚠️ révélateur (voir §5) |

### `boulanger` — nbHits = 13 644

| # | sub_type | title | organization_name | rome_labels | matched_words |
|---|---|---|---|---|---|
| 1 | offres_emploi_lba | Boulanger-viennoisier / Boulangère-viennoisière | LA FILLE DU BOULANGER | Boulanger / Boulangère | boulangerie, boulanger, boulangère |
| 2 | offres_emploi_partenaires | Boulanger-viennoisier / Boulangère-viennoisière (H/F) | LA BOULANGE DE CEDRIC | Boulanger / Boulangère | boulanger, boulangère |
| 3 | offres_emploi_partenaires | Boulanger / Boulangère | LES DELICES DU CAYLAR | Boulanger / Boulangère | boulanger, boulangère, boulangerie |
| 4 | offres_emploi_partenaires | Apprenti Boulanger H/F | E.Leclerc | Boulanger / Boulangère | boulanger, boulangerie, boulangère |
| 5 | offres_emploi_partenaires | Boulanger / Boulangère (H/F) | — | Boulanger / Boulangère | boulangerie, boulanger, boulangère |
| 6 | offres_emploi_partenaires | Boulanger / Boulangère (H/F) | SOPHIE LEBREUILLY | Boulanger / Boulangère | boulanger, boulangère |
| 7 | offres_emploi_partenaires | Boulanger / Boulangère | T.AYAVE | Boulanger / Boulangère | boulanger, boulangère, boulangerie |
| 8 | offres_emploi_partenaires | Boulanger / Boulangère | SAS LE CENTRE B | Chef boulanger / Cheffe boulangère | boulangerie, boulanger, boulangère |
| 9 | offres_emploi_partenaires | Apprenti boulanger | AAP | Boulanger / Boulangère | boulanger, boulangère, boulangerie |
| 10 | offres_emploi_partenaires | Boulanger / Boulangère | CRUNCH | Chef boulanger / Cheffe boulangère | boulangerie, boulanger, boulangère |

### `developpeur` — nbHits = 3 964

| # | sub_type | title | organization_name | rome_labels | matched_words |
|---|---|---|---|---|---|
| 1 | offres_emploi_partenaires | Développeur(se) | Service de l'action administra… | Développeur / Développeuse informatique | développeur, développeuse, développeurs |
| 2 | offres_emploi_lba | Développeur / Développeuse back-end | SCC FRANCE | Développeur / Développeuse web | développeur, développeuse |
| 3 | offres_emploi_lba | Développeur / Développeuse full-stack | CHARLIE SOLUTIONS | Développeur / Développeuse web | développeur, développeuse |
| 4 | offres_emploi_lba | Développeur / Développeuse d'application | I#START | Développeur / Développeuse logiciel ou d'appl… | développeur, développeuse |
| 5 | offres_emploi_lba | Développeur / Développeuse d'application | ELECTRONIC BIRD CONTROL | Développeur / Développeuse logiciel ou d'appl… | développeur, développeuse |
| 6 | offres_emploi_partenaires | Développeur | Commissariat au Numérique de D… | Développeur / Développeuse informatique | développeur, développeuse, développeurs |
| 7 | offres_emploi_lba | Développeur Web | MIAMARKET | Développeur / Développeuse web | développeur, développeuse |
| 8 | offres_emploi_lba | Développeur / Développeuse full-stack pour les datacent… | CERCLE DE LA BASE DE DEFENSE D… | Développeur / Développeuse web | développeur, développeuse |
| 9 | offres_emploi_lba | Développeur / Développeuse full-stack | AUXICARE | Développeur / Développeuse web | développeur, développeuse |
| 10 | offres_emploi_lba | Developpeur - Logiciels & Applications basé en MARTINIQ… | EZDRIVE | Développeur / Développeuse web | développeur, développeuse, developpeur |

### `marketing` — nbHits = 25 315

| # | sub_type | title | organization_name | rome_labels | matched_words |
|---|---|---|---|---|---|
| 1 | offres_emploi_partenaires | Employé Marketing - Alternance H/F | Marketing / Communication | Directeur / Directrice du marketing | marketing |
| 2 | offres_emploi_partenaires | Alternance - Assistant Chargé de Marketing & Média | Communication / Marketing | Directeur / Directrice du marketing | marketing |
| 3 | offres_emploi_partenaires | Alternance - Assistant Marketing - Marketing Digital H/… | — | Responsable marketing | marketing |
| 4 | offres_emploi_partenaires | Chargé Marketing / Web Marketing en alternance H/F | EXPLOITATIONS FORESTIÈRES BARI… | Responsable marketing | marketing |
| 5 | offres_emploi_partenaires | Alternance Brand Marketing | Red Bull France | Responsable marketing | marketing |
| 6 | offres_emploi_lba | Responsable marketing en alternance | PHARAON | Directeur / Directrice du marketing | marketing |
| 7 | offres_emploi_lba | Responsable marketing en alternance | RAJAN | Directeur / Directrice du marketing | marketing |
| 8 | offres_emploi_partenaires | Alternant Marketing Produit H/F | Gerflor | Responsable marketing | marketing |
| 9 | offres_emploi_partenaires | Assistant / Assistante marketing (H/F) | — | Responsable marketing | marketing |
| 10 | offres_emploi_partenaires | Apprenti Marketing (H/F) | LABORATOIRE PAUL HARTMANN | Responsable marketing | marketing |

### `service à la personne` — nbHits = 65 112

| # | sub_type | title | organization_name | rome_labels | matched_words |
|---|---|---|---|---|---|
| 1 | recruteurs_lba | ALS SERVICES A LA PERSONNE | ALS SERVICES A LA PERSONNE | *(vide)* | services, a, personne |
| 2 | recruteurs_lba | ESSENTIEL SERVICES A LA PERSONNE | ESSENTIEL SERVICES A LA PERSON… | *(vide)* | services, a, personne |
| 3 | recruteurs_lba | MKJ SERVICES A LA PERSONNE | MKJ SERVICES A LA PERSONNE | *(vide)* | services, a, personne |
| 4 | recruteurs_lba | ABC SERVICES A LA PERSONNE | ABC SERVICES A LA PERSONNE | *(vide)* | services, a, personne |
| 5 | offres_emploi_lba | Assistant(e) à la Coordination Service à la Personne | OZENE | Responsable de secteur d'aide à domicile | personnes, service, personne |
| 6 | offres_emploi_lba | Assistant(e) à la Coordination Service à la Personne | VIES & AGES | Responsable de secteur d'aide à domicile | personnes, service, personne |
| 7 | recruteurs_lba | H. GILLOT SERVICES A LA PERSONNE | H. GILLOT SERVICES A LA PERSON… | *(vide)* | services, a, personne |
| 8 | recruteurs_lba | ASSOCIATION DE SERVICES AUX PERSONNES | ASSOCIATION DE SERVICES AUX PE… | *(vide)* | services, personnes |
| 9 | offres_emploi_partenaires | Assistant Responsable des Opérations Réseau H/F | O2 | Responsable d'exploitation transport routier… | personnes, services, as, là |
| 10 | offres_emploi_partenaires | Chef de service (H/F) | — | Directeur / Directrice qualité services | services, service, personne |

## 5. Analyse

### Ce qui fonctionne
- **Métiers mono-mot (`boulanger`, `developpeur`, `marketing`)** : top 10 entièrement pertinent. Le couple `title ×7` + `rome_labels ×8` fait remonter les offres dont l'intitulé ET le métier correspondent. `rome_labels` peuplé 20/20.
- **Stemming FR** : `boulanger` matche `boulangerie`/`boulangère` ; `développeur` matche `développeuse`/`développeurs` ; `developpeur` (sans accent) matche aussi (asciiFolding implicite du stemming).
- **Mix des types** maîtrisé : offres LBA et partenaires se mélangent par pertinence sans qu'un type écrase l'autre.

### Limites constatées
1. **Trou de couverture `rome_labels` sur les recruteurs.** Sur `service à la personne`, les recruteurs en tête (rangs 1-4, 7, 8) ont `rome_labels` **vide** : ils remontent uniquement parce que leur **nom d'entreprise** contient « SERVICES A LA PERSONNE » (match `title`/`organization_name`). Cause probable : `rawR.rome_codes` absent pour ces SIRET, ou code ROME non résolu dans `referentielromes`. → Le signal métier déterministe n'est pas universel côté recruteurs (13/20 ici).
2. **Bruit des mots vides en requête multi-mots.** `à`/`la` sont des stopwords FR ; on voit des `matched_words` parasites (`a`, `là`, `as`) et un résultat hors-sujet (rang 9 « Responsable d'exploitation transport routier » via `à la`). Le rappel se disperse sur les requêtes à mots vides.
3. **`nbHits` très élevés** (`minimumShouldMatch: 1` → tout doc matchant un terme compte). Sans effet sur le top, mais à garder en tête pour la pagination / l'affichage du compteur.

## 6. Prochaines étapes / comparaisons à mener

- **Couverture `rome_labels` recruteurs** (priorité) : quantifier le % de recruteurs sans `rome_labels`, identifier la cause (rome_codes manquants vs codes hors référentiel), décider d'un fallback.
- **Phase 3 — autocomplétion** : implémenter le type `autocomplete` + endpoint `/v1/search/suggest`, puis rejouer ces 4 requêtes **et des préfixes** (`boul`, `dev`, `mark`, `serv`) dans `2026-XX-XX-comparaison-avec-phase3.md`. Hypothèse : impact fort sur la saisie partielle, faible sur les mots complets ci-dessus.
- **Calibrage des poids** : tester des variantes (ex. `rome_labels ×10`) — ajustable sans reindex.

---

*Données brutes : `_temp/search-baseline/raw_*.json` (non versionnées).*
