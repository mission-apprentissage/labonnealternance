# Désactivation des CFA absents du Référentiel

Job qui désactive les comptes des CFA dont le SIRET n'est plus au [Référentiel des organismes de formation](https://referentiel.apprentissage.onisep.fr) (#3316). Aucune notification n'est envoyée aux utilisateurs.

Code : [deactivate-unreferenced-cfa-accounts.ts](../server/src/jobs/recruiters/deactivate-unreferenced-cfa-accounts.ts).

Un SIRET fermé à l'INSEE relève d'un autre job : [desactivation-siret-fermes.md](./desactivation-siret-fermes.md).

## Déclenchement

- Cron `Désactivation des CFA absents du Référentiel` : le 15 janvier et le 15 juin à 6 h ([jobs.ts](../server/src/jobs/jobs.ts)). En production seulement : en recette, les SIRET de test absents du Référentiel désactiveraient les comptes de recette.
- À la main : `yarn cli cfa-referentiel:deactivate`. Options :

| Option | Défaut | Effet |
|---|---|---|
| `--dry-run` | non | Interroge le Référentiel et liste les CFA concernés sans rien écrire en base |
| `--max-deactivation-ratio <n>` | 0.1 | Part maximale des CFA à compte actif absents de la liste (cf. garde-fous) |
| `--min-referentiel-size <n>` | 5000 | Nombre minimal d'organismes attendus du Référentiel |

Avant une exécution réelle, `yarn cli cfa-referentiel:deactivate --dry-run --max-deactivation-ratio 1` liste tous les CFA concernés sans que le seuil n'interrompe la liste.

## Vérification

1. Lecture de la liste complète du Référentiel : `GET /api/v1/organismes?champs=siret`, environ 11 500 organismes en une page.
2. Sélection des CFA ayant au moins un rôle (`rolemanagements`, `authorized_type` = `CFA`) dont le dernier statut est `GRANTED` ou `AWAITING_VALIDATION`.
3. Pour chaque CFA dont le SIRET exact est absent de la liste, confirmation par `GET /api/v1/organismes/{siret}`, l'appel fait à la création de compte :

| Réponse | Traitement |
|---|---|
| 404 | Absent : règles ci-dessous |
| 200 portant le SIRET demandé | Présent : rien n'est modifié |
| Autre réponse, timeout, pas de réponse | Erreur technique : rien n'est modifié, le job finit en échec |

Seule l'absence compte : un organisme présent mais `fermé`, ou sans certification Qualiopi, n'est pas désactivé.

## Garde-fous

Le job s'arrête en échec, avant toute écriture, dans trois cas :

- la liste reçue ne couvre pas le total annoncé par la pagination (page manquante, doublons) ;
- la liste compte moins de `--min-referentiel-size` organismes ;
- plus de `--max-deactivation-ratio` des CFA à compte actif sont absents de la liste.

Après 10 erreurs techniques consécutives sur les appels unitaires, le job s'arrête en échec. Les CFA déjà traités le restent.

## Règles de désactivation

Toutes les modifications portent le motif `Non référencé dans le catalogue du Réseau des Carif-Oref` (`CFA_NOT_REFERENCED_REASON`), celui que proposent les admins à la désactivation manuelle d'un CFA. Elles sont faites par `deactivate-unreferenced-cfa-accounts` (`granted_by`).

Dans l'ordre d'application :

| Donnée | Collection | Modification |
|---|---|---|
| Offres déléguées | `jobs_partners` (`partner_label` = `offres_emploi_lba`, `cfa_siret` = SIRET du CFA) | `offer_status` passe à `Cancelled` pour les offres `Active`, `Pending` et `InReview`, avec une entrée dans `offer_status_history` |
| Rôles du CFA | `rolemanagements` (`authorized_type` = `CFA`) | Ajout d'un événement `DENIED` en validation `AUTOMATIQUE`, pour les rôles dont le dernier statut est `GRANTED` ou `AWAITING_VALIDATION` |

Les rôles passent `DENIED` en dernier : un CFA n'est sélectionné que tant qu'il a un rôle actif. Si l'annulation des offres échoue, le CFA garde ses rôles et le passage suivant reprend ses offres.

Ce qui n'est pas modifié :

- le compte utilisateur (`userswithaccounts`). Son email ne permet pas de créer un compte CFA sur un autre SIRET : la création de compte CFA refuse tout email déjà associé à un compte ;
- les entreprises partenaires du CFA, ni désactivées ni détachées ;
- `lastUpdateFromSource` du CFA, réservé à la lecture INSEE.

Un SIRET déréférencé ne peut pas recevoir de nouveau compte : la création de compte CFA interroge le Référentiel à chaque demande (`validateEligibiliteCfa`).

## Suivi

- Rapport Slack sur le canal des jobs : taille du Référentiel, CFA à compte actif, absents de la liste, trouvés à l'appel unitaire, erreurs, CFA désactivés avec leur SIRET (50 au plus, la liste complète est dans les logs du job). En dry-run, le rapport liste les CFA qui seraient désactivés.
- Le message est marqué en erreur et le job finit en échec sur un arrêt, une erreur technique du Référentiel ou un échec de traitement en base (l'erreur part dans Sentry).
- Comptes désactivés par le job : rôles dont le dernier événement a pour `granted_by` `deactivate-unreferenced-cfa-accounts`.

Le job est idempotent : relancé, il ne modifie ni un rôle déjà `DENIED`, ni une offre déjà annulée.
