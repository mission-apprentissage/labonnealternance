# Phase 3 — Build en CI et déploiement immuable des previews

## Objectif

Cette phase met en oeuvre la cible décrite dans le plan de migration :

1. sortir le build de la VM preview
2. produire des images Docker immuables en CI
3. déployer les previews par pull d’images depuis GHCR
4. réduire la durée et la variabilité des déploiements preview
5. faire d’un commentaire de déploiement une autorisation de publication, et non plus un ordre de build local

L’état cible de cette phase est simple : le runner GitHub Actions construit et pousse les images de preview, puis Ansible se contente de préparer l’environnement, puller les images, exécuter seed, indexes et migrations, puis lancer la stack.

## Périmètre

### Inclus

1. build et push des images preview dans la CI
2. consommation des images GHCR côté serveur preview
3. suppression du clone Git et du build local du flux preview
4. verrouillage du déploiement sur des images construites en amont
5. validations techniques minimales pour garantir l’immutabilité du flux

### Exclu

1. refonte complète de l’infrastructure preview
2. migration Kubernetes
3. remplacement du reverse proxy
4. refonte Metabase
5. changement du mécanisme d’opt-in utilisateur pour déclencher une preview

## État actuel

Aujourd’hui, le workflow preview fonctionne ainsi :

1. [../../.github/workflows/deploy_preview.yml](../../.github/workflows/deploy_preview.yml) est déclenché par commentaire
2. le dépôt est checkouté sur le runner GitHub Actions
3. Ansible est lancé vers le serveur preview
4. [../../.infra/ansible/tasks/preview_pr.yml](../../.infra/ansible/tasks/preview_pr.yml) clone le dépôt sur la VM preview
5. le build des images preview est exécuté localement sur la VM via `.bin/mna-lba app:build ... load ... preview`
6. la stack preview est ensuite démarrée localement avec Docker Compose

Ce modèle a plusieurs défauts :

1. la VM preview fait à la fois build, runtime et hébergement de services partagés
2. les builds preview sont sérialisés par verrou global
3. les temps de déploiement sont instables et fortement dépendants de la charge de la VM
4. le commit déployé n’est pas matérialisé d’abord comme artefact CI validé

## État cible

Le flux cible de phase 3 devient :

1. le workflow preview checkout le code de la PR
2. le runner GitHub Actions construit les images `mna_lba_server` et `mna_lba_ui` pour la preview
3. les images sont poussées dans GHCR avec des tags de preview sans suffixe d’environnement :
   1. `ghcr.io/mission-apprentissage/mna_lba_server:<pr_number>`
   2. `ghcr.io/mission-apprentissage/mna_lba_ui:<pr_number>`
4. Ansible prépare uniquement les fichiers d’environnement et le `docker-compose.yml` de la PR
5. Ansible exécute `docker compose pull`
6. Ansible exécute le seed conditionnel, les indexes et les migrations
7. Ansible lance `docker compose up -d --wait`

Dans ce modèle, la VM preview n’est plus un builder.

## Architecture cible détaillée

### Côté GitHub Actions

Le workflow de déploiement preview garde sa logique actuelle de contrôle d’accès et de commentaire, mais ajoute une étape de build/push avant l’appel Ansible.

Les responsabilités du runner deviennent :

1. checkout de la branche PR
2. récupération des assets LFS
3. setup Docker Buildx
4. authentification GHCR
5. build preview avec cache GitHub Actions
6. push des images preview
7. appel du playbook Ansible de déploiement

### Côté serveur preview

Le serveur preview ne fait plus que :

1. générer les fichiers `.env_server`, `.env_ui` et `docker-compose.yml`
2. puller les images depuis GHCR
3. seed la base Mongo si nécessaire
4. recréer les indexes Mongo
5. lancer les migrations
6. démarrer les containers preview

## Fichiers concernés

1. [../../.github/workflows/deploy_preview.yml](../../.github/workflows/deploy_preview.yml)
2. [../../.infra/ansible/tasks/preview_pr.yml](../../.infra/ansible/tasks/preview_pr.yml)
3. [../../.infra/docker-compose.preview.yml](../../.infra/docker-compose.preview.yml)
4. [../../docker-bake.json](../../docker-bake.json)
5. [../../.bin/scripts/app-build.sh](../../.bin/scripts/app-build.sh)

## Pré-requis techniques

### 1. Schéma de tags preview déjà harmonisé

La phase 3 repose sur le schéma désormais retenu pour les previews :

1. `mna_lba_server:<pr_number>`
2. `mna_lba_ui:<pr_number>`

Le document de phase 3 suppose donc que le point 6 a déjà été corrigé.

### 2. Cache Buildx déjà configuré

Le fichier [../../docker-bake.json](../../docker-bake.json) contient déjà :

1. `cache-from` en `type=gha`
2. `cache-to` en `type=gha`
3. la clé `DEPS_ID` issue de `yarn.lock`

Cela permet d’exploiter le cache GitHub Actions au lieu de rebuild sur le VPS.

### 3. Accès GHCR

Le workflow de preview doit pouvoir :

1. se connecter à `ghcr.io`
2. pousser les images générées
3. publier les tags preview correspondant à la PR

### 4. Pull d’images depuis le serveur preview

Le serveur preview doit pouvoir exécuter `docker compose pull` sur les images de preview.

Si les images restent publiques, aucun `docker login` n’est nécessaire sur le serveur.

## Implémentation cible

### Étape 1. Construire et pousser les images preview dans le workflow GitHub Actions

Le workflow [../../.github/workflows/deploy_preview.yml](../../.github/workflows/deploy_preview.yml) doit être complété avant l’appel du playbook.

Les ajouts attendus sont :

1. setup Docker Buildx
2. login GHCR
3. exposition du runtime GitHub pour le cache Buildx
4. build et push des images preview

Exemple cible :

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Login to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Expose GitHub Runtime
  uses: crazy-max/ghaction-github-runtime@v3

- name: Build and push Docker images
  run: .bin/mna-lba app:build "${{ github.event.issue.number }}" push commit-hash-temp preview
```

### Étape 2. Garder `docker-bake.json` comme source de vérité du build preview

Le groupe `preview` de [../../docker-bake.json](../../docker-bake.json) doit continuer à produire :

1. `server`
2. `ui-preview`

Le nom `ui-preview` est uniquement le nom interne du target Buildx. Il ne signifie plus que l’image finale porte un suffixe `-preview` dans son tag.

Avec les tags cibles actuels :

1. `ghcr.io/mission-apprentissage/mna_lba_server:${VERSION}`
2. `ghcr.io/mission-apprentissage/mna_lba_ui:${VERSION}`

Le target `ui-preview` existe précisément pour builder une UI en `PUBLIC_ENV=preview` tout en conservant un tag simple `:<pr_number>`.

Autrement dit :

1. le target s'appelle encore `ui-preview`
2. l'environnement de build reste `preview`
3. mais le tag publié dans GHCR est bien sans suffixe `-preview`

### Étape 3. Supprimer le clone Git et le build local du playbook preview

Dans [../../.infra/ansible/tasks/preview_pr.yml](../../.infra/ansible/tasks/preview_pr.yml), le bloc de déploiement preview doit arrêter de :

1. vérifier l’existence du repository local
2. pruner les références Git
3. cloner le dépôt
4. mettre à jour le sous-module `.bin/shared`
5. lancer `.bin/mna-lba app:build ... load ... preview`

Ces tâches doivent être remplacées par une étape de pull :

```yaml
- name: "[{{ pr_number }}] Pull Docker images"
  shell:
    chdir: "/opt/app/projects/{{ pr_number }}"
    cmd: docker compose pull
```

### Étape 4. Garder le seed, les indexes et les migrations côté serveur preview

La phase 3 ne déplace pas encore :

1. le seed MongoDB
2. la recréation des indexes
3. les migrations

Ces opérations restent côté serveur preview, car elles dépendent de l’environnement runtime et de la base dédiée à la PR.

### Étape 5. Sérialiser la recréation d’indexes

Le fichier [../../.infra/ansible/tasks/preview_pr.yml](../../.infra/ansible/tasks/preview_pr.yml) exécute aujourd’hui `indexes:recreate` sans verrou dédié.

La cible recommandée est d’ajouter un verrou explicite :

```yaml
- name: "[{{ pr_number }}] Create MongoDB indexes (before migrations)"
  shell:
    chdir: "/opt/app/projects/{{ pr_number }}"
    cmd: "flock --verbose --timeout 900 --close /tmp/deployment_index.lock docker compose run --rm server yarn cli indexes:recreate"
  async: 900
  poll: 15
```

Cela évite de déplacer le goulot d’étranglement du build vers une instabilité MongoDB sur les indexes.

### Étape 6. Forcer le runtime à consommer la dernière image preview

Le fichier [../../.infra/docker-compose.preview.yml](../../.infra/docker-compose.preview.yml) peut être renforcé avec `pull_policy: always` sur :

1. `server`
2. `ui`
3. `stream_processor`

Cela permet de limiter les risques de redéploiement avec image locale obsolète.

## Séquence cible de déploiement

```text
Commentaire 🚀
  -> deploy_preview.yml
  -> checkout + LFS + setup sécurité
  -> buildx build --push preview
  -> GHCR reçoit server:<pr_number> et ui:<pr_number>
  -> ansible preview.yml
  -> génération des env + docker-compose
  -> docker compose pull
  -> seed conditionnel
  -> indexes:recreate
  -> migrations:up
  -> docker compose up -d --wait
  -> publication URL preview
```

## Gains attendus

### Temps de déploiement

Les gains attendus viennent de :

1. la suppression du build sur la VM preview
2. l’exploitation du cache GitHub Actions
3. la suppression du verrou global de build preview
4. la parallélisation naturelle des builds sur runners GitHub

### Robustesse

La phase 3 apporte aussi :

1. une séparation claire entre build et déploiement
2. une meilleure traçabilité du commit déployé
3. une baisse de la charge CPU et disque sur le serveur preview
4. une réduction des causes d’échec non déterministes liées au build local

## Critères d’acceptation

La phase 3 sera considérée comme correctement mise en place si :

1. le workflow preview pousse bien les images preview dans GHCR avant le playbook
2. aucune étape de clone Git ou de build local n’est encore exécutée sur le serveur preview
3. le serveur preview ne fait qu’un `docker compose pull` avant le démarrage runtime
4. un redéploiement d’une PR réutilise bien les images poussées et non un rebuild local
5. le schéma de tags utilisé côté CI, runtime et cleanup reste strictement cohérent en `:<pr_number>`
6. les logs permettent d’identifier explicitement le tag et le SHA déployés

## Vérifications recommandées

### Vérifications avant bascule

1. vérifier le rendu de `docker buildx bake --print preview`
2. vérifier que les tags preview générés sont bien `mna_lba_server:<pr_number>` et `mna_lba_ui:<pr_number>`
3. vérifier que [../../.infra/docker-compose.preview.yml](../../.infra/docker-compose.preview.yml) consomme ces tags exacts
4. vérifier que le cleanup existant supprime bien ces mêmes tags

### Vérifications après bascule

1. déployer une PR de test
2. confirmer dans les logs GitHub Actions que le build preview est poussé dans GHCR
3. confirmer dans les logs Ansible qu’aucun clone Git ni build local n’est exécuté
4. confirmer que `docker compose pull` récupère les images attendues
5. redéployer la même PR et mesurer la baisse du temps total
6. fermer la PR et vérifier que le cleanup supprime toujours correctement la stack et les images locales

## Risques et points d’attention

1. il faut éviter qu’un tag flottant masque le SHA réellement déployé
2. il faut s’assurer que le workflow preview ne déploie pas une image non issue d’une CI valide
3. il faut garder un verrou sur les indexes MongoDB même après suppression du verrou de build
4. il faut vérifier que la stratégie de cache Buildx ne crée pas de surprise entre PRs quand `yarn.lock` change
5. il faut éviter de réintroduire un suffixe de tag différent entre CI, runtime et cleanup

## Rollback

Si la phase 3 pose problème, le rollback consiste à :

1. retirer les steps build/push ajoutés dans [../../.github/workflows/deploy_preview.yml](../../.github/workflows/deploy_preview.yml)
2. remettre dans [../../.infra/ansible/tasks/preview_pr.yml](../../.infra/ansible/tasks/preview_pr.yml) le clone Git, le sous-module et le build local
3. désactiver l’usage de `docker compose pull` comme étape principale du déploiement preview

Le rollback est simple car il remet en place le flux historique sans modifier l’infrastructure preview partagée.

## Ordre d’application recommandé

1. ajouter le verrou sur `indexes:recreate`
2. compléter [../../.github/workflows/deploy_preview.yml](../../.github/workflows/deploy_preview.yml) avec Buildx, login GHCR et build push
3. tester le build preview sur une PR dédiée
4. supprimer clone Git et build local de [../../.infra/ansible/tasks/preview_pr.yml](../../.infra/ansible/tasks/preview_pr.yml)
5. ajouter si nécessaire `pull_policy: always` dans [../../.infra/docker-compose.preview.yml](../../.infra/docker-compose.preview.yml)
6. valider un cycle complet : déploiement, redéploiement, fermeture de PR et cleanup

## Résultat attendu en fin de phase

À la fin de la phase 3 :

1. la preview est déployée à partir d’images construites par la CI
2. le serveur preview n’exécute plus de build applicatif
3. les previews deviennent plus rapides, plus stables et plus traçables
4. le terrain est préparé pour les étapes suivantes de gouvernance et de cleanup événementiel
