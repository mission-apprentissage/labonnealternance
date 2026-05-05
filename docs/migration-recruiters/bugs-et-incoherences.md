# Bugs et incohérences relevés

## Objectif

Ce document recense les bugs potentiels et les incohérences identifiés lors de la revue de la branche `lbac-3638-suppression-recruiters`.

Il ne s'agit pas d'une liste exhaustive de tous les changements, mais des points qui méritent une validation ou une correction avant de considérer la migration comme stabilisée.

## Constats principaux

### 1. La prolongation d'offre ne met plus à jour ses métadonnées

Fichier concerné : `server/src/services/formulaire.service.ts`

La fonction `extendOffre()` prolonge bien `offer_expiration`, mais laisse explicitement des TODO sur les champs associés à l'historique de prolongation et aux relances :

- `job_last_prolongation_date` n'est pas mis à jour ;
- `job_prolongation_count` n'est pas incrémenté ;
- `relance_mail_expiration_J7` n'est pas réinitialisé ;
- `relance_mail_expiration_J1` n'est pas réinitialisé.

Conséquence probable :

- perte de traçabilité métier sur les prolongations ;
- relances d'expiration potentiellement incohérentes après une prolongation ;
- écart de comportement avec l'ancien modèle `recruiters.jobs[]`.

Ce point ressemble à un bug fonctionnel réel, pas à un simple oubli cosmétique, car le code signale lui-même la migration incomplète.

### 2. Les champs de prolongation sont encore exposés, mais systématiquement vidés

Fichier concerné : `server/src/services/formulaire.service.ts`

Dans `jobPartnersToRecruiter()`, les champs suivants sont reconstruits à `null` :

- `job_last_prolongation_date` ;
- `job_prolongation_count`.

En parallèle :

- le modèle partagé `shared/src/models/job.model.ts` continue à les exposer ;
- l'UI les consomme encore, notamment dans `ui/components/espace_pro/ExportButton/ExportButtonNew.tsx`.

Conséquence probable :

- régression silencieuse dans l'export ou les écrans qui s'attendent à retrouver l'historique de prolongation ;
- disparition de données métier pourtant encore présentes dans les contrats applicatifs.

Ce point est une incohérence nette entre le contrat métier conservé et la donnée réellement fournie par la branche.

### 3. Les emails de relance peuvent perdre le nom de l'établissement

Fichiers concernés :

- `server/src/jobs/recruiters/recruiterOfferExpirationReminderJob.ts`
- `server/src/services/formulaire.service.ts`

Le job de relance envoie `workplace_name` comme `establishment_raison_sociale` dans le template email.

Or, lors de la création d'une offre LBA via `jobCreateToJobsPartner()`, `workplace_name` est rempli à `null`, tandis que les vraies informations de raison sociale sont portées par :

- `workplace_legal_name` ;
- `workplace_brand`.

Conséquence probable :

- emails de relance avec nom d'établissement vide ou moins pertinent que prévu ;
- régression discrète mais visible côté recruteur.

Ce point ressemble à un bug de mapping entre nouveau modèle et ancien template mail.

### 4. La mise à jour OPCO admin propage le changement à toutes les offres du SIRET

Fichier concerné : `server/src/http/controllers/user.controller.ts`

Lors d'une mise à jour admin sur `/admin/users/:userId/organization/:siret`, le code met à jour :

- l'entreprise ;
- puis toutes les entrées `jobs_partners` ayant `workplace_siret = siret`.

Le filtre utilisé ne limite pas la mise à jour aux offres LBA gérées par la plateforme. Il n'y a pas de contrainte sur :

- `partner_label` ;
- `managed_by`.

Conséquence probable :

- écrasement du champ `workplace_opco` sur des offres partenaires externes partageant le même SIRET ;
- mélange entre données de gestion interne et données importées.

Ce point est important car l'ancien comportement ciblait la donnée recruteur interne, alors que le nouveau code modifie potentiellement un périmètre bien plus large.

### 5. La documentation de migration et l'implémentation ne racontent pas exactement la même histoire

Fichiers concernés :

- `docs/migration-temp/02-schema-migration.md`
- `shared/src/models/jobsPartners.model.ts`
- `server/src/migrations/20260304120000-suppression-recruiters.ts`

La documentation de migration annonce l'ajout de plusieurs champs dans `jobs_partners`, notamment :

- `recruiter_status` ;
- `job_last_prolongation_date` ;
- `job_prolongation_count`.

Dans l'implémentation réellement présente sur la branche :

- `recruiter_status` n'est pas ajouté au modèle `jobs_partners` ;
- les champs de prolongation ne sont pas intégrés au modèle privé `jobs_partners` ;
- la migration de données ne les backfill pas.

La branche semble à la place recalculer une partie du statut recruteur depuis les rôles et les accès.

Conséquence probable :

- incompréhension en review ou en runbook de déploiement ;
- faux sentiment de couverture fonctionnelle si l'on se fie à la doc plus qu'au code ;
- risque de trous de migration sur les usages réellement dépendants de ces champs.

Ce point n'est pas forcément un bug runtime immédiat, mais c'est une incohérence de conception/documentation à corriger.

## Points à vérifier avant validation

1. Rejouer un scénario complet de prolongation d'offre et vérifier les dates de relance, le compteur de prolongation et l'export.
2. Vérifier le rendu des emails de relance pour une offre LBA nouvellement créée.
3. Contrôler qu'un changement d'OPCO sur une entreprise n'écrase pas les offres partenaires externes du même SIRET.
4. Aligner la documentation de migration avec ce qui est effectivement implémenté dans `jobs_partners`.
5. Décider explicitement si les données de prolongation doivent être migrées, recalculées ou abandonnées.

## Niveau de confiance

Les points 1 à 4 reposent sur des incohérences directement observables dans le code de la branche.

Le point 5 est surtout un écart documenté entre intention et implémentation, avec un risque réel sur la compréhension et l'exploitation de la migration.
