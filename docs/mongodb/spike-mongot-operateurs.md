# Spike — validation des opérateurs $search sur mongot community 0.60.1

Phase 0 du plan d'amélioration de la pertinence (14/07/2026). Tests exécutés contre la stack
Docker locale (MongoDB 8.2 + mongot community 0.60.1, index `algolia_search`, ~370k docs).

| Opérateur / feature | Résultat | Détail |
|---|---|---|
| `text` + `matchCriteria: "all"` | ✅ | Tous les termes requis dans le même champ. Fonctionne aussi **combiné avec `fuzzy`** ("product managr" + maxEdits 1 → "Product manager"). |
| `phrase` + `slop` | ✅ | `slop: 2` sur analyzer `lucene.french` — bonus d'adjacence exploitable. |
| `score: { function }` | ✅ | `multiply` / `constant` opérationnels (score × 2 vérifié). |
| `scoreDetails: true` + `$meta: "searchScoreDetails"` | ✅ | Décomposition BM25 complète — outil de diagnostic pour le tuning des boosts. |
| Hot-reload de la collection `search_synonyms` | ✅ | Un groupe inséré est pris en compte en **~5 s** sans recréation d'index (requête à t+0 : 0 hit, t+5s : 1 hit). Le re-seed des synonymes ne nécessite PAS `indexes:recreate`. |

## Mesure de traîne (le chiffre qui motive la Phase 1)

`$searchMeta` count sur `path: ["title", "description"]` :

| Requête | `matchCriteria` any (défaut) | `matchCriteria: "all"` |
|---|---|---|
| "product manager" | 15 560 hits | **272 hits** |

(Le service actuel cumule en plus les clauses par champ en `should`/`minimumShouldMatch: 1` +
fuzzy → 46 748 hits pour la même requête via l'API.)

## Implications pour la Phase 1

- `matchCriteria: "all"` est disponible mais **binaire** (tous les termes ou rien) : insuffisant
  seul pour la logique n−1 / 75 % → la structure "une clause de couverture par terme +
  `minimumShouldMatch` dynamique" reste l'approche retenue. `matchCriteria` pourra servir de
  clause bonus full-match simple.
- Aucun bloqueur : tous les opérateurs du design de Phase 1 sont fonctionnels sur mongot
  community.
- `scoreDetails` à utiliser ponctuellement en tuning (coût non mesuré, ne pas activer en prod).
