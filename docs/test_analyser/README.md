# Tests des analyzers & du boosting de recherche

> Ce dossier documente les **expériences** menées sur le moteur de recherche (`GET /api/v1/search`, index `algolia_search`) pour mesurer l'effet des analyzers et du boosting sur la pertinence.
> Chaque expérience est datée et reproductible. Les données brutes (JSON de réponse) restent dans `_temp/search-baseline/` (non versionnées) ; seules les synthèses sont ici.

## Index des expériences

| Date | Fichier | Objet |
|---|---|---|
| 2026-06-06 | [2026-06-06-baseline-boosting-sans-phase3.md](./2026-06-06-baseline-boosting-sans-phase3.md) | Baseline du boosting keyword-centric + `rome_labels` + `lba_company`, **avant** autocomplétion (Phase 3) |
| — | [comparaison-avec-phase3.md](./comparaison-avec-phase3.md) | Protocole de comparaison des 2 previews (base vs autocomplétion), à exécuter |

## Convention

- **Baseline « sans Phase X »** = état de référence capturé avant une évolution, pour comparer après.
- Mêmes requêtes, mêmes paramètres entre deux captures → seule la config change.
- Requêtes de test retenues : `boulanger`, `developpeur`, `marketing`, `service à la personne` (mono-mot fréquents + une requête multi-mots avec mots vides).
