# Règles de détection

Socle commun aux alertes poussées sur Slack (#5421, chapeau #5420) : une règle déclare une requête et des seuils, le socle se charge de la planification, de la déduplication, de la notification et de la persistance.

## Fonctionnement

Code : [server/src/jobs/detection/](../server/src/jobs/detection/). Un seul cron, `Évaluation des règles de détection`, passe toutes les 15 minutes en recette et en production ([jobs.ts](../server/src/jobs/jobs.ts)).

À chaque passage, pour chaque règle active dont le créneau est échu :

1. L'exécution prend un bail sur la règle dans `detection_rules` : une seule exécution évalue une règle à la fois, quel que soit le créneau. Le bail dure 10 minutes et se prolonge tant que l'évaluation tourne. Le créneau n'est marqué évalué qu'à la fin : si le process est tué, le bail expire et le passage suivant du cron réévalue le créneau.
2. `evaluate` renvoie des constats, un par objet (`key`) : identifiants techniques, comptes, une phrase et des liens. Un constat ou des mesures qui contiennent une adresse email, y compris dans un nom de métrique ou encodée dans un lien (`%40`), sont écartés et la règle passe en échec.
3. Chaque constat est rapproché de l'épisode en cours pour le même objet, dans `detection_alerts` :

| Situation | Effet | Notification |
|---|---|---|
| Nouveau constat, moins de `confirmations` constats consécutifs | épisode `en_attente` | aucune |
| `confirmations` constats consécutifs atteints | épisode `ouverte` | entrée en alerte |
| Constat toujours présent | épisode maintenu | rappel tous les `reminderEveryHours` |
| Constat disparu | épisode `fermee` (ou supprimé s'il était `en_attente`) | sortie d'alerte |

Une règle en échec (exception, seuils invalides en base, constat refusé) ne bloque pas les autres. Son échec forme un épisode à part (clé `echec_evaluation`, notifié à l'entrée, rappelé chaque jour, clos à la reprise) et le job finit en erreur. Le bail est libéré et le créneau n'a pas avancé : la règle est réévaluée au passage suivant du cron. Un envoi refusé par Slack n'ouvre pas d'épisode d'échec, qui partirait sur le même canal : l'épisode concerné n'est pas mis à jour, le job finit en erreur et le passage suivant retente l'envoi.

Le canal est celui de `LBA_DETECTION_SLACK_WEBHOOK`, ou à défaut celui des jobs (`LBA_JOB_SLACK_WEBHOOK`). La variable passe par [.infra/.env_server](../.infra/.env_server) : pour ouvrir le canal dédié, la renseigner dans le fichier sops de l'environnement (`.infra/env.<env>.yml`). Vide ou absente, les alertes partent sur le canal des jobs.

## Ajouter une règle

Déclarer un `IDetectionRule` ([detection-rule.ts](../server/src/jobs/detection/detection-rule.ts)) et l'ajouter à `detectionRules` ([detection-rules.ts](../server/src/jobs/detection/detection-rules.ts)). La périodicité est un multiple de 15 minutes, comptée depuis le 1er janvier 1970 à minuit UTC et décalée de `offsetMinutes` : une période qui divise 24 h part de minuit UTC chaque jour, une période hebdomadaire part du jeudi, jour de l'epoch. Les seuils sont un `z.strictObject` dont chaque champ a une valeur par défaut. Valider la requête par un `explain` dans le ticket de la règle, et les seuils par un rejeu sur l'historique avant d'activer la règle.

## Règles livrées

| Règle | Gravité | Constat | Seuils par défaut |
|---|---|---|---|
| `auto_validation_part_bal` | haute | La part des rôles entreprise tranchés validés par BAL tombe sous `dropRatio` fois celle des `baselineDays` jours précédents. Pendant l'alerte, la référence reste la part d'avant l'incident. Faute de volume, une alerte en cours reste ouverte et le message le précise. | 7 j contre 28 j, `dropRatio` 0,5, `minVolume` 50 rôles entreprise tranchés |
| `auto_validation_taux_global` | moyenne | Le taux d'auto-validation des comptes entreprise et CFA baisse d'au moins `dropThresholdPoints` points. Deux constats consécutifs. | 7 j contre 28 j, 10 points, `minVolume` 30 rôles tranchés par fenêtre |
| `auto_validation_indetermines` | technique | Les validations automatiques indéterminées (BAL ou fournisseur indisponible) dépassent `thresholdPercent` % des rôles évalués. | 7 j, 5 %, `minVolume` 30 rôles évalués |
| `creations_comptes_domaine` | haute | Un même domaine email cumule sur `windowHours` heures au moins `companyMinAccounts` comptes recruteur (`webmailMinAccounts` pour un webmail grand public ou jetable), et au moins `companySpikeRatio` (`webmailSpikeRatio`) fois son volume attendu. Une alerte ouverte se ferme quand le domaine passe sous `exitRatio` de l'un des deux seuils. Un constat par domaine, avec les identifiants des comptes, ceux créés dans la fenêtre et le nombre de rôles validés automatiquement. | 72 h, référence 28 j, 10 comptes et 3 fois le volume attendu pour chaque type de domaine, sortie sous la moitié |

Les trois règles d'auto-validation passent chaque jour à 5 h UTC, sur des fenêtres arrêtées à minuit UTC, et rappellent une alerte en cours chaque semaine. Code : [auto-validation-rate-alert.ts](../server/src/jobs/recruiters/auto-validation-rate-alert.ts).

`creations_comptes_domaine` (#5422) passe toutes les heures et rappelle une alerte en cours chaque jour. Un compte est un utilisateur dont un rôle entreprise ou CFA a été créé dans la fenêtre : un utilisateur qui rattache plusieurs entreprises compte une fois, et un utilisateur plus ancien qui reçoit un rôle compte aussi. L'alerte précise combien de ces comptes ont été créés dans la fenêtre. Le volume attendu d'un domaine est sa part des comptes créés sur les `baselineDays` jours précédant la fenêtre, appliquée au total de la fenêtre : la hausse de la rentrée relève d'autant le volume attendu de chaque domaine. Les webmails sont reconnus par la liste de `company-email-validator`, celle qu'utilise BAL. Les rôles validés automatiquement (hors création par clé API) aident à qualifier l'alerte : aucun parmi les comptes de l'incident de juin 2026, de 50 à 100 % selon les jours lors des pics légitimes du rejeu.

Une alerte ouverte ne se ferme qu'une fois le domaine passé sous `exitRatio` du seuil de comptes ou du multiple, soit 5 comptes ou 1,5 fois le volume attendu par défaut. Sans cet écart, un compte créé toutes les 7 h 30 fait osciller la fenêtre de 72 h entre 9 et 10 comptes, et chaque passage à 10 renvoie une entrée en alerte. Le message d'une alerte maintenue sous le seuil d'entrée le précise.

Le rejeu sur la production retrouve 21 comptes pour l'incident de juin 2026, du 29/06 au 04/07, dont 16 au plus sur 72 h ; l'issue en annonçait 25 en 3 jours. Avec un `webmailMinAccounts` de 17 ou plus, la règle l'aurait manqué.

Limite : avec le multiple par défaut de 3, un pic de P comptes passe inaperçu sur un domaine qui pèse habituellement plus de P / (2W + 3P) des créations, W étant le nombre de comptes créés dans la fenêtre hors pic. Pour un pic de 25 comptes : 9 % des créations pour W = 100, l'ordre de grandeur de la production en 2025-2026 ; 4 % pour W = 300. Code : [account-creation-domain-alert.ts](../server/src/jobs/recruiters/account-creation-domain-alert.ts).

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

Les réglages sont pris en compte au passage suivant du cron, sans redéploiement. L'identifiant de l'alerte figure dans chaque message Slack. Le taux de faux positifs d'une règle se lit sur `detection_alerts` (`qualification.verdict`), hors épisodes d'échec d'évaluation (clé `echec_evaluation`), que `qualifyDetectionAlert` refuse.

## Rejeu

```bash
sudo ./scripts/cli.sh replayDetectionRules --from 2024-01-01 --to 2026-10-21
sudo ./scripts/cli.sh replayDetectionRules --rule auto_validation_part_bal --from 2025-04-01 --to 2025-07-01 --thresholds '{"auto_validation_part_bal":{"dropRatio":0.4}}'
```

Le rejeu évalue chaque créneau de la période avec la déduplication du cron, sans rien écrire ni notifier. Il journalise une ligne par créneau, avec les mesures de la règle et les notifications qui seraient parties, puis la liste des épisodes. Sans `--thresholds`, il prend les seuils en vigueur. Il ne vaut que pour une règle qui lit des données datées.
