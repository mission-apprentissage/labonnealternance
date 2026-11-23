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
| `offres_compte_recent` | haute | Un compte dépose au moins `minOffers` offres, des offres qui cumulent au moins `minOpenings` postes, ou au moins `minNonConformeOffers` offres non conformes selon la modération, dans les `windowHours` heures qui suivent son ouverture. L'alerte reste ouverte jusqu'à `windowHours` + `holdHours` heures après l'ouverture, ou jusqu'à ce que tous les rôles du compte soient refusés ou désactivés. Un constat par compte, avec les SIRET de ses offres et le lien vers sa fiche au back-office. Désactivée par défaut. | 7 jours, 10 offres, 20 postes ou 2 non conformes, suivi 24 h de plus |

Les trois règles d'auto-validation passent chaque jour à 5 h UTC, sur des fenêtres arrêtées à minuit UTC, et rappellent une alerte en cours chaque semaine. Code : [auto-validation-rate-alert.ts](../server/src/jobs/recruiters/auto-validation-rate-alert.ts).

`creations_comptes_domaine` (#5422) passe toutes les heures et rappelle une alerte en cours chaque jour. Un compte est un utilisateur dont un rôle entreprise ou CFA a été créé dans la fenêtre : un utilisateur qui rattache plusieurs entreprises compte une fois, et un utilisateur plus ancien qui reçoit un rôle compte aussi. L'alerte précise combien de ces comptes ont été créés dans la fenêtre. Le volume attendu d'un domaine est sa part des comptes créés sur les `baselineDays` jours précédant la fenêtre, appliquée au total de la fenêtre : la hausse de la rentrée relève d'autant le volume attendu de chaque domaine. Les webmails sont reconnus par la liste de `company-email-validator`, celle qu'utilise BAL. Les rôles validés automatiquement (hors création par clé API) aident à qualifier l'alerte : aucun parmi les comptes de l'incident de juin 2026, de 50 à 100 % selon les jours lors des pics légitimes du rejeu.

Une alerte ouverte ne se ferme qu'une fois le domaine passé sous `exitRatio` du seuil de comptes ou du multiple, soit 5 comptes ou 1,5 fois le volume attendu par défaut. Sans cet écart, un compte créé toutes les 7 h 30 fait osciller la fenêtre de 72 h entre 9 et 10 comptes, et chaque passage à 10 renvoie une entrée en alerte. Le message d'une alerte maintenue sous le seuil d'entrée le précise.

Le rejeu sur la production retrouve 21 comptes pour l'incident de juin 2026, du 29/06 au 04/07, dont 16 au plus sur 72 h ; l'issue en annonçait 25 en 3 jours. Avec un `webmailMinAccounts` de 17 ou plus, la règle l'aurait manqué.

Limite : avec le multiple par défaut de 3, un pic de P comptes passe inaperçu sur un domaine qui pèse habituellement plus de P / (2W + 3P) des créations, W étant le nombre de comptes créés dans la fenêtre hors pic. Pour un pic de 25 comptes : 9 % des créations pour W = 100, l'ordre de grandeur de la production en 2025-2026 ; 4 % pour W = 300. Code : [account-creation-domain-alert.ts](../server/src/jobs/recruiters/account-creation-domain-alert.ts).

`offres_compte_recent` (#5423) passe toutes les heures. Une alerte dure au plus 8 jours avec les seuils par défaut et n'est rappelée qu'après 4 jours, donc au plus une fois. Elle est livrée désactivée, tant que les comptes de son rejeu ne sont pas qualifiés (cf. ci-dessous) ; `configureDetectionRule --rule offres_compte_recent --enabled true` l'active.

Un compte est un utilisateur qui a un rôle entreprise ou CFA. Il s'ouvre à la création de son premier rôle, ou de son premier rôle après le refus ou la désactivation de tous les précédents : une adresse sanctionnée qui se réinscrit sur un autre SIRET garde son utilisateur (`verifyRecruiterEmailInUse`, `findOrCreateUserWithAccount`), et c'est le nouveau rôle qui compte, même quand le rôle refusé a été créé dans les jours précédents. Seuls les rôles et les offres depuis l'ouverture comptent, et une alerte du rôle refusé se ferme sans passer au nouveau. Un utilisateur dont un rôle plus ancien est encore actif n'est pas suivi : aucun parcours d'inscription ne le permet aujourd'hui, mais des données anciennes ou un rôle réaccordé par un administrateur le peuvent. Le statut des rôles est lu à l'instant évalué, d'après leurs événements datés.

Sont comptées les offres LBA dont le compte est gestionnaire (`managed_by`), créées dans la fenêtre, quel que soit leur statut actuel : une offre annulée à la désactivation du compte reste comptée, et le rejeu voit aussi les comptes déjà désactivés. Le nombre d'offres ne baisse pas, celui des non conformes si : une offre validée par un modérateur en sort, et y revient quand une modification relance la classification. Une alerte ouverte reste donc ouverte jusqu'à la fin du suivi, même repassée sous les seuils, et le message le précise ; elle se ferme plus tôt si tous les rôles du compte sont refusés ou désactivés. Le délai de maintien (`holdHours`, au moins une période de la règle) laisse au créneau suivant le temps de voir une offre déposée juste avant la fin de la fenêtre.

Exclusions :

- un compte créé par clé API partenaire (`classifyRole`) : aucun chemin de production n'en crée depuis la suppression du dépôt d'offre par API v1 et v2 (#2686, février 2026), l'exclusion vaut pour les comptes plus anciens ;
- les offres publiées par un partenaire via l'API v3 : elles portent le libellé du partenaire et aucun `managed_by` ;
- une offre validée par un modérateur ne compte pas parmi les non conformes. Une offre dont un champ est non conforme compte, même si l'analyse de l'autre champ a échoué.

Le verdict de modération et le nombre de postes, que chaque modification de l'offre réécrit (`patchOffre`), ne sont pas datés : le rejeu d'un créneau passé lit leur dernière valeur. Le maintien de l'alerte couvre une baisse du nombre de postes. La variante non conforme ne vaut qu'à partir de la mise en production de la classification (v1.937.0, 14/10/2026). Elle recoupe la règle prévue par #5806 sur les mêmes offres, mais par compte et pour un compte neuf : #5806 signale chaque offre non conforme à revoir, cette règle signale le compte à vérifier. Code : [recent-account-offers-alert.ts](../server/src/jobs/recruiters/recent-account-offers-alert.ts).

Rejeu sur la production, en trois agrégations Compass, des 9 106 comptes ouverts du 01/04 au 18/11/2026 :

- 5 offres en 24 h, la lettre de l'issue, ne retrouvent aucun des 20 comptes désactivés après accès avec un motif de fraude du back-office : aucun n'a déposé plus d'une offre dans les 24 h suivant son ouverture. Ce réglage signale 2 comptes désactivés au motif libre « Autre » et 26 comptes jamais refusés.
- Le volume se trouve dans les désactivations au motif libre « Autre » : 14 des 56 comptes ouverts sur la période ont déposé au moins 10 offres avant leur désactivation, aucun validé automatiquement. Sans accès accordé, l'espace recruteur refuse le dépôt (`getGrantedRoles`) : un compte ne dépose que l'offre de son inscription, et son volume vient après l'accès, pour 16 de ces 56 comptes plus de 24 h après l'ouverture.
- Sur 7 jours, 20 postes cumulés signalent 14 de ces comptes, 1 compte de référence et 12 comptes jamais refusés, dont 5 CFA ; 10 offres en signalent 7, aucun de référence et 12 jamais refusés, dont 8 CFA. Les CFA ne font que 702 des 8 314 comptes jamais refusés : un CFA neuf qui publie pour ses entreprises partenaires atteint vite ces seuils, des seuils propres aux CFA restent une option. À 7 jours, compter depuis l'ouverture ou depuis le premier accès donne les mêmes effectifs. D'où les seuils par défaut ; leur union n'a pas été mesurée, `replayDetectionRules` la donnera une fois la règle en production.
- Les comptes de référence restent hors d'atteinte du volume, au mieux 2 sur 20. Une offre à 5 postes en touche 6, mais aussi 108 comptes jamais refusés et 38 refusés à la validation : c'est un autre signal, non retenu. Les 24 autres comptes de référence avaient été ouverts 3 ans plus tôt en médiane.
- La variante non conforme n'est pas encore évaluable : aucun compte ouvert depuis le 14/10 n'a eu plus d'une offre non conforme.

Ces effectifs ne sont pas des taux de précision : les comptes « Autre » ne sont pas qualifiés, certains ont été désactivés ensemble, et les seuils ont été choisis après coup. Les agrégations retiennent une seule ouverture par compte, la première de la période : le volume d'une réinscription après une sanction sur la période leur échappe.

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
