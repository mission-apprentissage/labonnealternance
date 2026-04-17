# Plan de migration du système de preview

## Objectif

Migrer le système de preview d’un modèle build et run sur une VM partagée vers un modèle build immuable en CI puis déploiement distant par pull d’images, tout en corrigeant à court terme l’asymétrie de nettoyage des images preview par une harmonisation complète du schéma de tags.

L’objectif est de réduire le couplage, stabiliser les temps de déploiement, rendre les previews traçables par SHA validé, et éviter l’accumulation d’images orphelines.

## Architecture actuelle

Le système de preview actuel repose sur quatre couches principales :

1. Des workflows GitHub Actions pour la CI, le déclenchement des previews par commentaire et le nettoyage planifié.
2. Un playbook Ansible qui prépare et maintient l’infrastructure preview partagée.
3. Une stack Docker Compose système commune à toutes les previews.
4. Une stack Docker Compose dédiée à chaque PR, avec une base MongoDB dédiée par preview.

### Flux actuel résumé

1. Une PR est ouverte ou mise à jour.
2. Le workflow [preview.yml](../../.github/workflows/preview.yml) publie un commentaire expliquant comment déclencher une preview.
3. Un commentaire `🚀` déclenche [deploy_preview.yml](../../.github/workflows/deploy_preview.yml).
4. Le workflow prépare le runner GitHub Actions, puis appelle `.bin/mna-lba app:deploy preview <pr_number>`.
5. Ansible démarre ou maintient le système preview partagé sur l’hôte distant.
6. Le dépôt est cloné sur la VM preview au SHA de la PR.
7. Les images Docker sont buildées localement sur cette VM.
8. La base `preview_<pr_number>` est seedée si nécessaire.
9. Les indexes et migrations MongoDB sont exécutés.
10. Les services `server`, `ui` et `stream_processor` de la PR sont démarrés.
11. L’URL de preview est publiée sur la PR.
12. Le nettoyage se fait principalement la nuit via un cron qui supprime les previews fermées, les bases orphelines et lance des prunes Docker globaux.

## Points forts de l’existant

1. Isolation des données par PR via une base MongoDB dédiée.
2. Coût maîtrisé grâce à une infrastructure preview mutualisée.
3. Déclenchement manuel, qui évite de créer une preview pour chaque PR sans besoin réel.
4. Intégration déjà en place avec Metabase, SMTP et reverse proxy.

## Limites structurelles

### 1. Le build est fait sur la VM preview

L’hôte preview cumule trois rôles :

1. builder Docker
2. runtime applicatif
3. hébergement des services partagés

Cela crée une contention forte sur le CPU, le disque et le daemon Docker.

### 2. Le déploiement n’est pas strictement immuable

Le SHA est récupéré au moment du playbook et le build est refait sur l’hôte distant. La preview ne correspond donc pas à un artefact déjà produit et validé par la CI.

### 3. Les builds et les seeds sont sérialisés

Deux verrous globaux limitent fortement le parallélisme :

1. `/tmp/deployment_build.lock`
2. `/tmp/deployment_seed.lock`

Le système devient lent dès que plusieurs previews sont demandées simultanément.

### 4. Toute la plateforme preview dépend d’une seule machine

Si la VM preview ou le daemon Docker a un problème, toutes les previews sont dégradées ou indisponibles.

### 5. Le nettoyage n’est pas assez événementiel

La suppression des previews fermées repose principalement sur un cron journalier. Les ressources fermées peuvent donc rester exposées et consommer des ressources jusqu’au passage du cleanup.

### 6. Nettoyage asymétrique des images preview

Le défaut initial était le suivant :

1. l’image UI était taggée avec un suffixe `-preview`
2. l’image server ne l’était pas
3. le cleanup supprimait des tags incomplets ou incohérents

Résultat : le nettoyage reposait en pratique sur des `docker prune` globaux, moins précis et plus agressifs.

## Correction immédiate du point 6

La stratégie retenue est une harmonisation complète des tags preview, en supprimant le suffixe `-preview` pour converger vers un schéma simple et symétrique.

### Schéma cible pour les previews

Les deux images preview utilisent désormais le même modèle :

1. `ghcr.io/mission-apprentissage/mna_lba_server:<pr_number>`
2. `ghcr.io/mission-apprentissage/mna_lba_ui:<pr_number>`

### Changements à appliquer

1. `docker-bake.json`
   Le groupe `preview` doit produire les images server et UI sans suffixe d’environnement pour les tags utilisés par les PRs.
2. `.infra/docker-compose.preview.yml`
   Les services preview doivent pointer vers les tags `:<pr_number>` pour le server et l’UI.
3. `.infra/ansible/tasks/preview_pr.yml`
   Le cleanup doit supprimer explicitement les tags `:<pr_number>` pour les images preview.

### Bénéfices immédiats

1. Schéma de tags lisible et prévisible.
2. Suppression exacte des images utilisées par la preview.
3. Réduction de la dépendance aux prunes Docker globaux.
4. Base plus saine pour la migration vers des images immuables construites en CI.

## Plan de migration complet

### Phase 1. Documentation et cadrage

#### Objectifs

1. Cartographier officiellement le flux actuel de preview depuis GitHub Actions jusqu’au host preview.
2. Documenter les limites structurelles observées : build sur l’hôte preview, verrous globaux, dépendance à un hôte unique, destruction différée des previews fermées et nettoyage Docker agressif.
3. Réécrire la documentation preview pour qu’elle reflète la réalité opérationnelle et la cible.

#### Actions

1. Documenter la séquence complète du déploiement preview.
2. Documenter les dépendances système partagées : MongoDB, reverse proxy, SMTP, Metabase et métriques.
3. Documenter les limites connues et les points de couplage.

#### Livrables

1. Ce document de plan.
2. Une documentation preview d’exploitation plus détaillée.

### Phase 2. Stabilisation court terme

#### Objectifs

1. Corriger les défauts de cohérence sans refonte complète.
2. Réduire les nettoyages agressifs.
3. Préparer la séparation build/deploy.

#### Actions

1. Corriger le point 6 par harmonisation complète du schéma de tags preview.
2. Ajouter un cleanup événementiel à la fermeture de PR, en complément du cron existant.
3. Séparer clairement les responsabilités build et deploy dans les workflows GitHub Actions.
4. Réduire la dépendance à `docker image prune --all --force` comme mécanisme principal de récupération d’espace.

#### Résultat attendu

Le runtime preview devient plus prévisible, le cleanup plus précis, et le cycle de vie des previews plus propre.

### Phase 3. Migration vers des artefacts immuables

#### Objectifs

1. Sortir le build de la VM preview.
2. Déployer uniquement des images GHCR produites par la CI.
3. Garantir que la preview correspond à un SHA validé.

#### Actions

1. Étendre la CI PR pour construire les images preview server et UI, les tagger de façon immuable avec le SHA, et les pousser dans GHCR.
2. Conserver éventuellement un alias par PR pour l’ergonomie humaine, mais faire du SHA la source de vérité.
3. Refactorer le déploiement preview pour qu’Ansible ne clone plus le dépôt sur l’hôte et ne lance plus de build local.
4. Générer seulement les fichiers d’environnement et le compose de runtime, faire un `docker compose pull`, exécuter indexes et migrations si nécessaire, puis `docker compose up -d --wait`.
5. Verrouiller le déploiement preview sur un statut CI réussi du SHA ciblé.

#### Résultat attendu

La VM preview n’est plus un builder. Elle devient uniquement un hôte de runtime et de services partagés.

### Phase 4. Simplification d’exploitation

#### Objectifs

1. Réduire les dépendances opérationnelles du système partagé.
2. Introduire des garde-fous minimaux de gouvernance et d’observabilité.

#### Actions

1. Réévaluer le couple `nginx-proxy` / `acme-companion`.
2. Envisager un wildcard certificate ou un routeur plus simple à opérer.
3. Documenter explicitement le rôle de MongoDB, Metabase, SMTP et des métriques dans l’environnement preview.
4. Ajouter une supervision minimale de l’hôte preview, un suivi des bases orphelines, un suivi des images GHCR par PR et une procédure de recovery documentée.

### Phase 5. Nettoyage final de l’ancien modèle

#### Objectifs

Retirer du flux preview ce qui ne sera plus nécessaire une fois le runtime par pull d’images stabilisé.

#### Actions

1. Supprimer le clone du dépôt sur la VM pour le flux preview.
2. Supprimer la logique de build locale pour les previews.
3. Réduire ou supprimer les verrous de build globaux.
4. Limiter les prunes Docker globaux aux cas de maintenance exceptionnelle.

## Fichiers concernés

1. [../../.github/workflows/preview.yml](../../.github/workflows/preview.yml) : workflow d’entrée PR qui publie les consignes de déploiement preview.
2. [../../.github/workflows/deploy_preview.yml](../../.github/workflows/deploy_preview.yml) : workflow de déploiement actuel par commentaire, à faire évoluer pour consommer des images validées par la CI.
3. [../../.github/workflows/preview_cleanup.yml](../../.github/workflows/preview_cleanup.yml) : cleanup nocturne, à compléter par une suppression événementielle sur fermeture de PR.
4. [../../.infra/ansible/preview.yml](../../.infra/ansible/preview.yml) : bootstrap du système preview partagé et point d’entrée Ansible principal.
5. [../../.infra/ansible/preview_cleanup.yml](../../.infra/ansible/preview_cleanup.yml) : nettoyage de l’environnement preview et des bases Mongo orphelines.
6. [../../.infra/ansible/tasks/preview_pr.yml](../../.infra/ansible/tasks/preview_pr.yml) : cœur du déploiement et de la suppression par PR ; contient la logique de build locale à retirer et le cleanup à fiabiliser.
7. [../../.infra/docker-compose.preview.yml](../../.infra/docker-compose.preview.yml) : définition runtime des services par PR.
8. [../../.infra/docker-compose.preview-system.yml](../../.infra/docker-compose.preview-system.yml) : services partagés de l’environnement preview.
9. [../../docker-bake.json](../../docker-bake.json) : source de vérité du schéma de tags des images Docker.
10. [../../.bin/scripts/app-build.sh](../../.bin/scripts/app-build.sh) : build local actuel, à déprécier pour le flux preview cible.
11. [../../.bin/shared/scripts/app-deploy.sh](../../.bin/shared/scripts/app-deploy.sh) : routage du déploiement preview via Ansible, à conserver mais simplifier lorsque le build sort de la VM.
12. [../infrastructure/preview.md](../infrastructure/preview.md) : documentation à réécrire pour refléter la réalité opérationnelle et la cible.

## Vérifications recommandées

1. Vérifier le flux actuel en lecture seule : confirmer les étapes et les couplages entre workflows, playbooks et compose, puis consigner la séquence cible dans la documentation preview.
2. Pour le point 6, vérifier le schéma de tags effectif rendu par `docker buildx bake --print preview` et confirmer que server et UI convergent bien vers le même modèle `:<pr_number>`.
3. Après harmonisation du tagging preview, vérifier que le compose runtime référence les tags server et UI attendus, et que le cleanup Ansible supprime exactement ces mêmes tags sans dépendre d’un prune global.
4. Tester un cycle complet sur une PR de test : déploiement preview, redéploiement, fermeture de PR, suppression immédiate, puis vérification qu’aucune image locale ni base Mongo `preview_<PR>` ne subsiste.
5. Vérifier que le cron de cleanup reste idempotent après ajout du cleanup événementiel, en particulier sur les previews déjà supprimées.
6. Une fois la migration CI immuable faite, vérifier qu’un déploiement preview ne clone plus le dépôt et n’exécute plus `.bin/mna-lba app:build` sur l’hôte preview.
7. Vérifier que le SHA déployé correspond exactement à une image GHCR produite par une CI verte, et que le workflow refuse un SHA non validé.

## Décisions prises dans ce plan

1. Correction du point 6 par harmonisation complète du schéma de tags preview, pas par simple patch du cleanup.
2. Portée incluse : documentation du flux actuel, correction du tagging preview, préparation de la sortie du build hors VM, cleanup immédiat sur fermeture de PR, et trajectoire de migration vers des images immuables construites en CI.
3. Portée exclue à ce stade : migration directe vers Kubernetes, refonte complète de Metabase, remplacement immédiat du reverse proxy, et redesign global de l’infrastructure preview hors besoins du flux PR.
4. Recommandation de mise en œuvre : traiter d’abord le point 6 et le cleanup événementiel, puis sortir le build de la VM preview dans une seconde itération.

## Considérations complémentaires

1. Pour l’autorisation de création de preview, conserver le commentaire `🚀` est possible, mais un label dédié serait plus simple à auditer et à automatiser. La recommandation est de garder l’opt-in mais de le découpler du build.
2. Pour les certificats, un wildcard sur le domaine preview réduirait les dépendances ACME par PR. La recommandation est de l’évaluer avant d’augmenter le volume de previews simultanées.
3. Pour la rétention GHCR, prévoir dès la migration CI immuable une politique de purge des tags PR fermées afin d’éviter de déplacer simplement le problème d’accumulation depuis la VM vers le registre.
