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
| `comptes_multiples_siret` | moyenne | Un même SIRET porte au moins `minAccounts` comptes entreprise actifs ayant chacun une offre en ligne. Ces comptes relèvent d'au moins `minIdentities` identités email, et deux d'entre eux ont été créés à moins de `maxCreationGapHours` heures d'écart. Une alerte ouverte reste ouverte tant que le SIRET garde `minAccounts` comptes actifs, dont `exitRatio` × `minAccounts` avec une offre en ligne, et que l'ensemble de ses comptes actifs remplit les deux critères. Un constat par SIRET, avec les identifiants des comptes, leur date de création et leur nombre d'offres. | Désactivée par défaut. 2 comptes, 2 identités, créés à moins de 24 h d'écart, fermée sous 2 comptes qui publient |

Les trois règles d'auto-validation passent chaque jour à 5 h UTC, sur des fenêtres arrêtées à minuit UTC, et rappellent une alerte en cours chaque semaine. Code : [auto-validation-rate-alert.ts](../server/src/jobs/recruiters/auto-validation-rate-alert.ts).

`creations_comptes_domaine` (#5422) passe toutes les heures et rappelle une alerte en cours chaque jour. Un compte est un utilisateur dont un rôle entreprise ou CFA a été créé dans la fenêtre : un utilisateur qui rattache plusieurs entreprises compte une fois, et un utilisateur plus ancien qui reçoit un rôle compte aussi. L'alerte précise combien de ces comptes ont été créés dans la fenêtre. Le volume attendu d'un domaine est sa part des comptes créés sur les `baselineDays` jours précédant la fenêtre, appliquée au total de la fenêtre : la hausse de la rentrée relève d'autant le volume attendu de chaque domaine. Les webmails sont reconnus par la liste de `company-email-validator`, celle qu'utilise BAL. Les rôles validés automatiquement (hors création par clé API) aident à qualifier l'alerte : aucun parmi les comptes de l'incident de juin 2026, de 50 à 100 % selon les jours lors des pics légitimes du rejeu.

Une alerte ouverte ne se ferme qu'une fois le domaine passé sous `exitRatio` du seuil de comptes ou du multiple, soit 5 comptes ou 1,5 fois le volume attendu par défaut. Sans cet écart, un compte créé toutes les 7 h 30 fait osciller la fenêtre de 72 h entre 9 et 10 comptes, et chaque passage à 10 renvoie une entrée en alerte. Le message d'une alerte maintenue sous le seuil d'entrée le précise.

Le rejeu sur la production retrouve 21 comptes pour l'incident de juin 2026, du 29/06 au 04/07, dont 16 au plus sur 72 h ; l'issue en annonçait 25 en 3 jours. Avec un `webmailMinAccounts` de 17 ou plus, la règle l'aurait manqué.

Limite : avec le multiple par défaut de 3, un pic de P comptes passe inaperçu sur un domaine qui pèse habituellement plus de P / (2W + 3P) des créations, W étant le nombre de comptes créés dans la fenêtre hors pic. Pour un pic de 25 comptes : 9 % des créations pour W = 100, l'ordre de grandeur de la production en 2025-2026 ; 4 % pour W = 300. Code : [account-creation-domain-alert.ts](../server/src/jobs/recruiters/account-creation-domain-alert.ts).

`comptes_multiples_siret` (#5424) passe chaque jour à 6 h UTC et rappelle une alerte en cours tous les 30 jours. Elle traite le stock : plusieurs comptes entreprise publient sur un même SIRET. C'est un signal, pas une preuve, car des collègues d'un même établissement publient légitimement. Les comptes d'un SIRET sont ceux dont le rôle porte sur l'entreprise de ce SIRET, `entreprises.siret` étant unique.

Elle est livrée désactivée. Pour l'activer, rejouer d'abord l'année écoulée sur la production et comparer les épisodes au tableau ci-dessous. L'état au dernier créneau du rejeu donne le nombre d'alertes qui partiront au premier passage. Les clés d'épisode journalisées sont des SIRET : elles restent dans les journaux du serveur.

```bash
sudo ./scripts/cli.sh replayDetectionRules --rule comptes_multiples_siret --from 2025-11-18 --to 2026-11-17
sudo ./scripts/cli.sh configureDetectionRule --rule comptes_multiples_siret --enabled true
```

- Compte actif : rôle entreprise dont le dernier événement de statut daté au plus tard du créneau est GRANTED. Un compte désactivé au back-office (rôle DENIED) ne compte plus, même s'il garde des offres en ligne. Un compte CFA ne compte pas, même au SIRET de l'entreprise, ni ses offres déléguées.
- Offre en ligne : offre LBA déposée par le compte, au SIRET de l'entreprise, déposée avant le créneau, pas encore expirée, et publiée au créneau d'après `offer_status_history`.
- Identités email : un domaine d'entreprise compte une fois, chaque compte webmail à part (liste de `company-email-validator`, comme pour `creations_comptes_domaine`). Des collègues sous le domaine de leur entreprise n'alertent pas ; un compte webmail à côté d'un compte d'entreprise, deux webmails ou deux domaines d'entreprise alertent. Le message ne donne que le nombre de domaines et de webmails, jamais le domaine.
- Écart de création : deux au moins des comptes qui publient ont été créés à moins de `maxCreationGapHours` heures d'écart (date de création du rôle). Un compte qui rejoint le SIRET des mois plus tard n'alerte pas : le cas cité par l'issue, une offre publiée en 2025 puis une autre sous un second compte en 2026, est hors cible. Sur le rejeu de l'année, l'ancienneté n'est suivie que d'une désactivation par le support (tableau ci-dessous).
- Alerte ouverte : les deux critères se lisent sur l'ensemble des comptes actifs du SIRET, y compris ceux qui ne publient plus. Par défaut (`exitRatio` 1), l'alerte se ferme dès qu'il reste moins de deux comptes qui publient. Un `exitRatio` de 0,5 la maintient tant qu'un compte publie. Sur le rejeu sans critère, il évite 10 réouvertures sur 243 alertes, mais double leur durée médiane et ajoute 73 notifications. Avec les critères par défaut, il n'évite qu'une réouverture.

Choix des critères : rejeu de la production du 18/11/2025 au 17/11/2026, rappel à 30 jours, sans maintien. L'agrégation Compass arrondit les créations au jour, d'où une fourchette pour l'écart de 24 h.

| Critère | Alertes ouvertes | SIRET | Notifications | Alertes suivies d'une désactivation par le support (hors nettoyage du 20 au 24/07) |
|---|---|---|---|---|
| Aucun | 243 | 199 | 591 | 22 (9) |
| Identités | 119 | 101 | 300 | 10 (3) |
| Écart de création < 24 h | 78 à 81 | 67 à 70 | 195 à 204 | 15 (5) |
| Identités et écart < 24 h (défaut) | 42 à 45 | 37 à 40 | 109 à 118 | 9 (2) |
| Comptes créés à 180 jours d'écart au moins | 65 | 53 | 151 | 1 (1) |

La dernière colonne n'est pas une précision, et elle repose sur peu de cas. Dans 11 des 15 SIRET concernés, le compte désactivé avait été créé le même jour qu'un autre, ce qui avantage d'office l'écart de création ; elle ne dit rien des SIRET que le support n'a pas regardés. Les identités divisent le volume par deux sans changer cette part, l'ancienneté la fait tomber à presque rien, l'écart de création la double.

Le défaut combine les deux critères, lus indépendamment : avec trois comptes qui publient ou plus, la paire créée à moins de 24 h peut partager un domaine d'entreprise, l'autre identité venant d'un troisième compte. Exiger que la paire elle-même relève de deux identités ne change rien sur le rejeu de l'année. Du 09 au 11/06/2026, des offres LBA annulées à tort puis restaurées (#4813) ferment et rouvrent les alertes en cours : sans cet incident, le défaut en ouvre 37.

Limite : un webmail absent de la liste de `company-email-validator` compte comme un domaine d'entreprise. Deux comptes `proton.me`, `bbox.fr` ou `nordnet.fr` sur un même SIRET font une seule identité et n'alertent pas, quand deux comptes `gmail.com` alertent. Le message les compte aussi parmi les domaines d'entreprise. La liste est celle de BAL et de `creations_comptes_domaine` : la compléter change aussi cette règle.

Les observations du cron comptent les pertes : `comptes_supprimes` (rôles dont l'utilisateur a été effacé) et `roles_sans_siret` (rôles d'une entreprise introuvable ou sans SIRET, dans les groupes d'au moins `minAccounts` rôles). Les deux valent 0 sur la copie locale de la production.

Chaque lien ouvre la fiche du compte au back-office, où le bloc des autres comptes du même SIRET (#5451) signale un téléphone ou un nom en commun. Ce bloc lit le statut d'un compte au dernier rang de son historique, pas à la dernière date, et compte toutes ses offres, closes comprises : la règle ne le réutilise pas.

À date égale, le dernier événement d'un historique est le dernier du tableau, comme pour `getLastStatusEvent` (cf. `lastEventExpr`).

La règle reconstitue le stock au créneau évalué, ce qui rend le rejeu valable sur les dates passées, à deux approximations près. Le statut de dépôt d'une offre n'est pas tracé : il est déduit en attente si l'historique commence par la publication de l'offre ou par l'expiration d'une offre en attente, et publié sinon. Avant #5479 (24/09/2026), la clôture d'une offre par son recruteur ne laissait pas de trace : #5429 l'a datée de `updated_at`, postérieure à la clôture, et seule l'expiration borne alors la période en ligne. Un compte supprimé depuis (effacement RGPD) n'est plus lu.

La requête lit tous les rôles entreprise créés avant le créneau par l'index `authorized_type_1_createdAt_1`, puis joint les entreprises par `_id`, les offres par `managed_by_1` et les comptes par `_id`. Sur une copie obfusquée de la production au 10/11/2026 (28 000 rôles), une évaluation prend environ 250 ms. Code : [multi-account-siret-alert.ts](../server/src/jobs/recruiters/multi-account-siret-alert.ts).

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
