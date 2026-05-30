# Capitalisation - suppression de `recruiters`

## Objectif

Ce document capitalise les apprentissages issus de l'analyse de la branche `lbac-3638-suppression-recruiters`.

L'objectif de cette branche est de retirer la dépendance à la collection `recruiters` en faisant de `jobs_partners` la source principale pour les offres LBA, tout en conservant les invariants métier attendus côté formulaire, permissions, jobs techniques et UI espace pro.

## Ce que la branche montre

### 1. La vraie complexité n'est pas la suppression d'une collection

Le point central n'est pas de supprimer `recruiters`, mais de déplacer vers `jobs_partners` des responsabilités qui étaient jusqu'ici réparties entre plusieurs couches :

- stockage des offres LBA ;
- rattachement de l'offre à son gestionnaire ;
- regroupement par établissement ;
- suivi des relances et prolongations ;
- support des écrans espace pro et des contrôles d'accès.

En pratique, la branche confirme qu'une suppression de collection devient une migration d'ownership métier.

### 2. `jobs_partners` devient le modèle pivot

Le schéma partagé de `jobs_partners` absorbe plusieurs champs auparavant portés implicitement par `recruiters` ou par `recruiters.jobs[]` :

- `managed_by` ;
- `establishment_id` ;
- `relance_mail_expiration_J7` ;
- `relance_mail_expiration_J1` ;
- `offer_rome_appellation` ;
- `mer_sent`.

Apprentissage : la migration ne consiste pas seulement à recopier des données, mais à rendre explicites dans le bon modèle des informations qui conditionnent déjà l'autorisation, l'affichage et les traitements batch.

### 3. `establishment_id` reste structurant

La branche et la documentation existante convergent : `establishment_id` ne peut pas être retiré sans casser des usages de regroupement côté serveur et UI.

Apprentissage : même si l'identifiant semble hérité de `recruiters`, il continue de porter une sémantique applicative utile pour :

- agréger les offres par établissement ;
- reconstruire certains écrans espace pro ;
- relier des actions utilisateur à un périmètre établissement plutôt qu'à une simple offre.

## Changements structurants observés

### Migration de données

La migration [server/src/migrations/20260304120000-suppression-recruiters.ts](/Users/kevin/Documents/projets/beta/labonnealternance/server/src/migrations/20260304120000-suppression-recruiters.ts) déroule les `jobs` embarqués dans `recruiters` puis recopie les métadonnées nécessaires dans `jobs_partners`.

Ce que cela enseigne :

- le matching réel se fait au niveau de l'identifiant d'offre, pas au niveau recruteur ;
- `managed_by` doit être normalisé en `ObjectId` pour rester compatible avec les requêtes existantes ;
- les cas non appariés doivent être tracés explicitement, car ils révèlent un écart entre la donnée historique et la donnée exploitable.

La présence de `requireShutdown = true` montre aussi qu'on est face à une migration de rupture opérationnelle, pas à une simple évolution additive.

### Permissions et ownership

Le service [server/src/security/authorisationService.ts](/Users/kevin/Documents/projets/beta/labonnealternance/server/src/security/authorisationService.ts) lit désormais directement `jobs_partners` pour résoudre les ressources liées aux offres.

Apprentissages :

- les permissions deviennent plus simples quand l'ownership est porté par l'offre elle-même ;
- la résolution par `managed_by` et `workplace_siret` remplace des lectures indirectes via un recruteur puis son tableau `jobs[]` ;
- la qualité de `managed_by` devient critique pour la sécurité fonctionnelle.

Autrement dit, l'authorization devient plus lisible, mais aussi plus dépendante de la qualité de migration des métadonnées.

### Service formulaire

Le service [server/src/services/formulaire.service.ts](/Users/kevin/Documents/projets/beta/labonnealternance/server/src/services/formulaire.service.ts) porte une large partie de la bascule.

Ce que la branche met en évidence :

- la création d'offre écrit directement dans `jobs_partners` ;
- les workflows délégation, archivage, lecture détaillée et regroupement d'offres sont réorganisés autour de ce stockage direct ;
- la logique historique qui passait par `recruiters` a été remplacée par des requêtes plus directes, mais parfois plus exigeantes sur les champs privés disponibles.

Apprentissage important : la réussite de la migration dépend moins d'une grosse migration finale que d'une capacité à réécrire proprement les cas métier du formulaire.

### Jobs batch et dette historique

La branche supprime ou réécrit plusieurs jobs sous `server/src/jobs/recruiters/` et ajuste la planification globale dans [server/src/jobs/jobs.ts](/Users/kevin/Documents/projets/beta/labonnealternance/server/src/jobs/jobs.ts).

Ce que cela révèle :

- la collection `recruiters` était encore utilisée comme point d'entrée de plusieurs traitements techniques ;
- supprimer une collection impose de revisiter les cron jobs, les exports, l'anonymisation et les relances ;
- la dette la plus coûteuse n'est pas dans les endpoints, mais dans les jobs secondaires qui manipulent des champs métier moins visibles.

## Impacts transverses à retenir

### Contrat API et modèle partagé

Le modèle partagé [shared/src/models/jobsPartners.model.ts](/Users/kevin/Documents/projets/beta/labonnealternance/shared/src/models/jobsPartners.model.ts) devient la clé de voûte de la migration.

Apprentissages :

- il faut faire monter au niveau partagé les champs réellement utilisés en backend ;
- une migration de persistance finit toujours par remonter dans le contrat typé ;
- tant que le modèle partagé n'exprime pas correctement les champs privés LBA, la migration reste fragile.

### UI espace pro

Les changements UI sont limités en volume, mais significatifs en dépendances : les composants espace pro continuent à consommer les mêmes parcours métier, avec un backend qui ne repose plus sur `recruiters`.

Apprentissage : une migration backend réussie ici est celle qui préserve les usages UI sans imposer de rupture de contrat fonctionnel visible.

### CFA et gestion entreprise

La migration [server/src/migrations/20260318120000-fill-entreprises-managed-by-cfa.ts](/Users/kevin/Documents/projets/beta/labonnealternance/server/src/migrations/20260318120000-fill-entreprises-managed-by-cfa.ts) montre qu'une partie du sujet dépasse les seules offres : la relation CFA, entreprise et gestionnaire doit rester reconstruisible une fois `recruiters` supprimé.

Apprentissage : retirer `recruiters` oblige à consolider les liens organisationnels annexes qui s'étaient appuyés dessus comme source d'appoint.

## Risques identifiés

### 1. Offres orphelines

Si `managed_by` est absent, invalide ou non convertible, l'offre reste techniquement présente mais devient difficile à rattacher correctement aux parcours de gestion et aux contrôles d'accès.

### 2. Écarts entre historique et état cible

La migration logue les documents sans correspondance dans `jobs_partners`. Ces écarts ne sont pas du bruit : ils matérialisent les limites de la synchro historique et doivent être traités comme un indicateur de qualité de migration.

### 3. Régressions dans les jobs secondaires

Les relances d'expiration, les exports, l'anonymisation et les traitements de mise en relation dépendent de champs métier spécifiques. Une migration qui passe sur les endpoints mais oublie ces jobs reste incomplète.

### 4. Dépendance forte à la qualité du modèle privé LBA

Plus on rapproche les cas métier de `jobs_partners`, plus on dépend de la cohérence de ses champs privés. Il faut donc considérer ce modèle comme un vrai modèle applicatif, pas seulement comme un entrepôt d'offres partenaire.

## Ce qu'il faut retenir pour la suite

1. Traiter `jobs_partners` comme la source canonique des offres LBA, pas comme une simple cible de synchronisation.
2. Vérifier systématiquement la qualité de `managed_by`, `workplace_siret` et `establishment_id` dans toute évolution future.
3. Tester les parcours métier complets, pas uniquement les lectures unitaires de documents.
4. Garder une attention particulière sur les jobs techniques qui utilisaient encore `recruiters` comme entrée implicite.
5. Considérer les documents non appariés en migration comme un vrai sujet produit/ops, pas comme un détail de logs.

## Fichiers pivots pour comprendre ou prolonger la migration

- [server/src/migrations/20260304120000-suppression-recruiters.ts](/Users/kevin/Documents/projets/beta/labonnealternance/server/src/migrations/20260304120000-suppression-recruiters.ts)
- [server/src/migrations/20260318120000-fill-entreprises-managed-by-cfa.ts](/Users/kevin/Documents/projets/beta/labonnealternance/server/src/migrations/20260318120000-fill-entreprises-managed-by-cfa.ts)
- [server/src/security/authorisationService.ts](/Users/kevin/Documents/projets/beta/labonnealternance/server/src/security/authorisationService.ts)
- [server/src/services/formulaire.service.ts](/Users/kevin/Documents/projets/beta/labonnealternance/server/src/services/formulaire.service.ts)
- [server/src/jobs/jobs.ts](/Users/kevin/Documents/projets/beta/labonnealternance/server/src/jobs/jobs.ts)
- [shared/src/models/jobsPartners.model.ts](/Users/kevin/Documents/projets/beta/labonnealternance/shared/src/models/jobsPartners.model.ts)
- [docs/migration-temp/00-README.md](/Users/kevin/Documents/projets/beta/labonnealternance/docs/migration-temp/00-README.md)
- [docs/migration-temp/02-schema-migration.md](/Users/kevin/Documents/projets/beta/labonnealternance/docs/migration-temp/02-schema-migration.md)
