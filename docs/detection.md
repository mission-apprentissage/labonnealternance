# Règles de détection

Socle commun aux alertes poussées sur Slack (#5421, chapeau #5420) : une règle déclare une requête et des seuils, le socle se charge de la planification, de la déduplication, de la notification et de la persistance.

## Fonctionnement

Code : [server/src/jobs/detection/](../server/src/jobs/detection/). Un seul cron, `Évaluation des règles de détection`, passe toutes les 15 minutes en recette et en production ([jobs.ts](../server/src/jobs/jobs.ts)).

À chaque passage, pour chaque règle active dont le créneau est échu :

1. Le créneau est réservé dans `detection_rules` : deux exécutions qui se chevauchent n'évaluent la règle qu'une fois.
2. `evaluate` renvoie des constats, un par objet (`key`) : identifiants techniques, comptes, une phrase et des liens. Un constat qui contient une adresse email est écarté et la règle passe en échec.
3. Chaque constat est rapproché de l'épisode en cours pour le même objet, dans `detection_alerts` :

| Situation | Effet | Notification |
|---|---|---|
| Nouveau constat, moins de `confirmations` constats consécutifs | épisode `en_attente` | aucune |
| `confirmations` constats consécutifs atteints | épisode `ouverte` | entrée en alerte |
| Constat toujours présent | épisode maintenu | rappel tous les `reminderEveryHours` |
| Constat disparu | épisode `fermee` (ou supprimé s'il était `en_attente`) | sortie d'alerte |

Une règle en échec (exception, seuils invalides en base, constat refusé) ne bloque pas les autres. Son échec forme un épisode à part (clé `echec_evaluation`, notifié à l'entrée, rappelé chaque jour, clos à la reprise) et le job finit en erreur. Le créneau est libéré : la règle est réévaluée au passage suivant du cron.

Le canal est celui de `LBA_DETECTION_SLACK_WEBHOOK`, ou à défaut celui des jobs (`LBA_JOB_SLACK_WEBHOOK`).

## Ajouter une règle

Déclarer un `IDetectionRule` ([detection-rule.ts](../server/src/jobs/detection/detection-rule.ts)) et l'ajouter à `detectionRules` ([detection-rules.ts](../server/src/jobs/detection/detection-rules.ts)). La périodicité est un multiple de 15 minutes, comptée depuis minuit UTC. Les seuils sont un `z.strictObject` dont chaque champ a une valeur par défaut. Valider la requête par un `explain` dans le ticket de la règle, et les seuils par un rejeu sur l'historique avant d'activer la règle.

## Règles livrées

| Règle | Gravité | Constat | Seuils par défaut |
|---|---|---|---|
| `auto_validation_part_bal` | haute | La part des rôles entreprise tranchés validés par BAL tombe sous `dropRatio` fois celle des `baselineDays` jours précédents. Pendant l'alerte, la référence reste la part d'avant l'incident. | 7 j contre 28 j, `dropRatio` 0,5, `minVolume` 50 rôles entreprise tranchés |
| `auto_validation_taux_global` | moyenne | Le taux d'auto-validation des comptes entreprise et CFA baisse d'au moins `dropThresholdPoints` points. Deux constats consécutifs. | 7 j contre 28 j, 10 points, `minVolume` 30 rôles tranchés par fenêtre |
| `auto_validation_indetermines` | technique | Les validations automatiques indéterminées (BAL ou fournisseur indisponible) dépassent `thresholdPercent` % des rôles évalués. | 7 j, 5 %, `minVolume` 30 rôles évalués |

Les trois règles passent chaque jour à 5 h UTC, sur des fenêtres arrêtées à minuit UTC, et rappellent une alerte en cours chaque semaine. Code : [auto-validation-rate-alert.ts](../server/src/jobs/recruiters/auto-validation-rate-alert.ts).

## Exploitation

Sur le serveur :

```bash
sudo ./scripts/cli.sh listDetectionRules
sudo ./scripts/cli.sh runDetectionRules --rule <id> --dry-run
sudo ./scripts/cli.sh configureDetectionRule --rule <id> --enabled false
sudo ./scripts/cli.sh configureDetectionRule --rule <id> --thresholds '{"minVolume":50}'
sudo ./scripts/cli.sh configureDetectionRule --rule <id> --reset
sudo ./scripts/cli.sh qualifyDetectionAlert --id <id de l'alerte> --verdict faux_positif
sudo ./scripts/cli.sh sendDetectionTestAlert
```

Les réglages sont pris en compte au passage suivant du cron, sans redéploiement. L'identifiant de l'alerte figure dans chaque message Slack. Le taux de faux positifs d'une règle se lit sur `detection_alerts` (`qualification.verdict`).

## Rejeu

```bash
sudo ./scripts/cli.sh replayDetectionRules --from 2024-01-01 --to 2026-10-21
sudo ./scripts/cli.sh replayDetectionRules --rule auto_validation_part_bal --from 2025-04-01 --to 2025-07-01 --thresholds '{"auto_validation_part_bal":{"dropRatio":0.4}}'
```

Le rejeu évalue chaque créneau de la période avec la déduplication du cron, sans rien écrire ni notifier. Il journalise une ligne par créneau, avec les mesures de la règle et les notifications qui seraient parties, puis la liste des épisodes. Sans `--thresholds`, il prend les seuils en vigueur. Il ne vaut que pour une règle qui lit des données datées.
