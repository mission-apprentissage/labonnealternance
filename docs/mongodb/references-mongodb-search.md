# Références MongoDB Search (doc officielle)

Pointeurs vers la documentation officielle — à consulter en ligne plutôt que d'en copier
le contenu ici (les copies périment).

## Index `llms.txt` (consommables par les agents IA)

- **MongoDB Search (fonctionnel)** — analyzers, synonymes, index definitions, opérateurs `$search`/`$searchMeta` :
  https://www.mongodb.com/docs/search/llms.txt
- **mongot self-managed (community search)** — configuration, authentification, monitoring, sizing, upgrade :
  https://www.mongodb.com/docs/search/self-managed/current/llms.txt
- Index général de la doc MongoDB : https://www.mongodb.com/docs/llms.txt

## Liens directs utiles

- Analyzers : https://www.mongodb.com/docs/atlas/atlas-search/analyzers/
- Custom analyzers : https://www.mongodb.com/docs/atlas/atlas-search/analyzers/custom/
- Synonymes : https://www.mongodb.com/docs/atlas/atlas-search/synonyms/
- Opérateurs `$search` : https://www.mongodb.com/docs/atlas/atlas-search/operators-and-collectors/
- Facettes (`$searchMeta`) : https://www.mongodb.com/docs/atlas/atlas-search/facet/
- Config mongot self-managed : https://www.mongodb.com/docs/search/self-managed/current/configure-mongot/reference/

## Doc interne LBA

- [search-config-finale.md](./search-config-finale.md) — configuration de l'index `search_items` (source de vérité)
- [api-search.md](./api-search.md) — référence de l'API `/v1/search`
- [analyse-search-analyzers.md](./analyse-search-analyzers.md) — justification des choix d'analyzers
- [current-behavior.md](./current-behavior.md) — comportement du moteur (tri, géo, facettes)
- [../infrastructure/mongodb-local.md](../infrastructure/mongodb-local.md) — setup local et serveurs
