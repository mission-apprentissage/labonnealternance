# Expérience — Comparaison avec / sans Phase 3 (autocomplétion)

**Statut :** protocole prêt — à exécuter sur les 2 previews.

## Objectif

Mesurer l'apport de l'autocomplétion par préfixe (Phase 3) par rapport à la baseline ([2026-06-06-baseline-boosting-sans-phase3.md](./2026-06-06-baseline-boosting-sans-phase3.md)).

## Dispositif — 2 previews

| Preview | Branche | Contenu |
|---|---|---|
| A (base) | `feat/lba-3249-poc-mongodb` | Refonte couche matching (rome_labels, lba_company, boosting). Suggestions barre = `/v1/search` (mots complets). |
| B (phase 3) | `feat/lba-3249-search-autocomplete` | A + endpoint `/v1/search/suggest` (autocomplete edgeGram) + barre branchée dessus. |

## Protocole

### 1. Mots complets (régression — doit rester stable)
Rejouer les 4 requêtes de la baseline sur `/v1/search` (A et B) : `boulanger`, `developpeur`, `marketing`, `service à la personne`. Le top 10 ne doit pas régresser (la Phase 3 ne touche pas `/v1/search`).

### 2. Préfixes (apport attendu de la Phase 3)
Comparer les suggestions sur saisie partielle :

| Saisie | Preview A — `/v1/search` (titres top 5) | Preview B — `/v1/search/suggest` |
|---|---|---|
| `boul` | _(à capturer)_ | _(à capturer)_ |
| `dév` | _(à capturer)_ | _(à capturer)_ |
| `mark` | _(à capturer)_ | _(à capturer)_ |
| `serv` | _(à capturer)_ | _(à capturer)_ |

Commande type (preview B) :
```bash
curl -s -G "<host>/api/v1/search/suggest" --data-urlencode "q=boul" --data-urlencode "limit=8" | jq .suggestions
```

### Critères de comparaison
- **Pertinence des suggestions** sur préfixe court (3-5 car.) : A retourne-t-il quelque chose d'utile ? B est-il plus pertinent / plus rapide à proposer le bon métier ?
- **Latence** ressentie (autocomplete vs full-text + extraction titres).
- **Bruit** : suggestions hors-sujet.

## Hypothèse
Impact fort sur la saisie partielle (préfixes), faible voire nul sur les requêtes en mots complets.
