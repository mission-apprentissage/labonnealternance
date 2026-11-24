# Désactivation des comptes à SIRET fermé

Job qui interroge l'API Entreprise pour chaque entreprise et chaque CFA en base, puis désactive les comptes dont l'établissement est fermé à l'INSEE (#5437). Aucune notification n'est envoyée aux utilisateurs.

Code : [deactivate-closed-siret-accounts.ts](../server/src/jobs/recruiters/deactivate-closed-siret-accounts.ts).

## Déclenchement

- Cron `Désactivation des comptes à SIRET fermé` : le 15 février et le 15 novembre à 1 h ([jobs.ts](../server/src/jobs/jobs.ts)). En production seulement : une exécution en recette consommerait le même quota d'appels.
- À la main : `yarn cli closed-siret:deactivate`, avec les options suivantes :

| Option | Défaut | Effet |
|---|---|---|
| `--dry-run` | non | Interroge l'API et rapporte les actions sans rien écrire en base |
| `--limit <n>` | aucune | Nombre maximal de SIRET interrogés |
| `--requests-per-minute <n>` | 200 | Cadence d'appel, 250 au plus |
| `--recheck-after-days <n>` | 30 | Ignore les organisations vérifiées depuis moins de N jours |

## Organisations vérifiées

- `entreprises` dont le dernier statut n'est pas `DESACTIVE`
- tous les `cfas`

Dans les deux cas, le job écarte les organisations dont `lastUpdateFromSource` a moins de 30 jours. Un SIRET partagé par une entreprise et un CFA ne donne lieu qu'à un appel.

## Appel API Entreprise

`GET /v3/insee/sirene/etablissements/diffusibles/{siret}`, champ `data.etat_administratif` (`A` actif, `F` fermé) et `data.date_fermeture`.

| Réponse | Traitement |
|---|---|
| 200, `etat_administratif` = `A` | Rien n'est modifié, `lastUpdateFromSource` est mis à jour |
| 200, `etat_administratif` = `F` | Règles de fermeture ci-dessous, `lastUpdateFromSource` est mis à jour |
| 404, 422, 451, ou 200 sans `etat_administratif` | Non concluant : rien n'est modifié, le SIRET est repris au passage suivant |
| 5xx, timeout, pas de réponse | Erreur technique : rien n'est modifié, le SIRET est repris au passage suivant |
| 429 | Attente du délai `Retry-After`, puis nouvel appel sur le même SIRET |

Un SIRET non diffusible (451) n'est jamais désactivé : l'endpoint utilisé ne renvoie que les données publiques.

### Volumétrie

L'endpoint est limité à 250 requêtes par minute, partagées avec les autres API INSEE du groupe et avec le site, qui interroge la même API à la création de compte ([catalogue](https://entreprise.api.gouv.fr/catalogue/insee/etablissements_diffusibles), [règles de volumétrie](https://entreprise.api.gouv.fr/developpeurs#respecter-la-volumetrie)). Le plafond de 5 000 requêtes par minute par IP ne s'applique pas à cet endpoint.

- Le job espace ses appels à 200 par minute. Pour environ 60 000 SIRET, il tourne autour de 5 h.
- Quand `RateLimit-Remaining` passe sous 25, le job attend la minute suivante (`RateLimit-Reset`) : ces 25 requêtes restent au site.
- Le job s'arrête en échec après 3 réponses 429 consécutives, ou après 10 appels consécutifs sans réponse. L'API Entreprise bannit pour 12 h une IP qui ignore les 429, et une IP bannie ne reçoit plus aucune réponse.

Après un arrêt, une relance reprend les SIRET non encore vérifiés grâce à `lastUpdateFromSource`.

## Règles de fermeture

Toutes les modifications portent le motif `SIRET fermé (API Entreprise)` (`CLOSED_SIRET_REASON`). Elles sont faites par `deactivate-closed-siret-accounts` (champ `granted_by` des rôles, `granted_by` de l'historique des offres).

### Entreprise (recruteur, ou partenaire d'un CFA)

| Donnée | Collection | Modification |
|---|---|---|
| Entreprise | `entreprises` | Ajout d'un événement `DESACTIVE` dans `status` |
| Rôles des recruteurs | `rolemanagements` (`authorized_type` = `ENTREPRISE`) | Ajout d'un événement `DENIED` dans `status`, pour les rôles dont le dernier statut est `GRANTED` ou `AWAITING_VALIDATION` |
| Rattachement aux CFA | `entreprise_managed_by_cfa` | Suppression des documents de l'entreprise |
| Offres | `jobs_partners` (`partner_label` = `offres_emploi_lba`, `workplace_siret` = SIRET fermé) | `offer_status` passe à `Cancelled` pour les offres `Active`, `Pending` et `InReview`, avec une entrée dans `offer_status_history` |
| Cache SIRET | `cache_siret` | `data.data.etat_administratif` passe à `F` |

Les offres annulées couvrent à la fois les offres du recruteur et celles qu'un CFA a déposées pour cette entreprise. Les offres déjà pourvues ou expirées ne sont pas modifiées.

La mise à jour du cache empêche la recréation d'un compte sur le SIRET fermé : la création de compte lit l'état administratif dans ce cache, qui n'expire pas.

### CFA

| Donnée | Collection | Modification |
|---|---|---|
| Rôles du CFA | `rolemanagements` (`authorized_type` = `CFA`) | Ajout d'un événement `DENIED` dans `status`, pour les rôles dont le dernier statut est `GRANTED` ou `AWAITING_VALIDATION` |
| Offres déléguées | `jobs_partners` (`partner_label` = `offres_emploi_lba`, `cfa_siret` = SIRET fermé) | `offer_status` passe à `Cancelled`, comme ci-dessus |

Les entreprises partenaires du CFA ne sont ni désactivées ni détachées. Sans rôle actif, le CFA ne peut plus en ajouter.

### Ce qui n'est pas modifié

- Le compte utilisateur (`userswithaccounts`) n'est pas désactivé. L'utilisateur peut recréer un compte sur un autre SIRET : sans rôle `GRANTED` ou `AWAITING_VALIDATION`, son email est de nouveau disponible.
- Une organisation au SIRET actif, ou dont l'état n'a pas pu être lu, n'est jamais modifiée.

## Suivi

- Collection `closed_siret_actions` : une ligne par modification appliquée, avec `run_id`, `siret`, `date_fermeture`, `organization_type`, `organization_id` et `action` (`ENTREPRISE_DESACTIVEE`, `ROLE_DESACTIVE`, `RETRAIT_DU_CFA`, `OFFRES_ANNULEES`). Selon l'action : `role_id` et `user_id`, `cfa_id`, ou `offers_count`. Le dry-run n'y écrit rien.
- Comptes désactivés par le job : rôles dont le dernier événement a pour `reason` `SIRET fermé (API Entreprise)`.
- Rapport Slack en fin d'exécution, sur le canal des jobs : SIRET interrogés, actifs, fermés et non concluants, nombre d'actions, `run_id`. Le message est marqué en erreur et le job finit en échec dans trois cas : l'exécution s'est arrêtée avant la fin, plus de 5 % des SIRET interrogés sont en erreur technique, ou le traitement en base d'un SIRET a échoué. Dans ce dernier cas, l'erreur part dans Sentry, le job passe au SIRET suivant, et le SIRET en échec est repris au passage suivant.

Le job est idempotent : relancé, il ne modifie ni un rôle déjà `DENIED`, ni une offre déjà annulée, ni une entreprise déjà `DESACTIVE`.
