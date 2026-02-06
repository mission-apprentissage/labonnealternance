# Développement

- [Développement](#développement)
  - [Organisation des dossiers](#organisation-des-dossiers)
  - [Git Flow et Déploiements](#git-flow-et-déploiements)
    - [Architecture des branches](#architecture-des-branches)
    - [Workflow de développement](#workflow-de-développement)
    - [Déploiements](#déploiements)
    - [Gestion des hotfixes](#gestion-des-hotfixes)
  - [Opérations](#opérations)
    - [Installation et Mise à jour des dépendences](#installation-et-mise-à-jour-des-dépendences)
  - [Linter](#linter)
  - [Prettier](#prettier)
  - [Typescript](#typescript)
    - [Arrêt des services](#arrêt-des-services)
    - [Suppression des services](#suppression-des-services)
      - [Server CLI](#server-cli)
    - [Emails](#emails)
    - [Debugger sous VSCode](#debugger-sous-vscode)
      - [Server Inspect](#server-inspect)

## Organisation des dossiers

- Le dossier `/.infra` contient la configuration de l'instructure.
- Le dossier `/.github` contient l'ensemble des Github Actions.
- Le dossier `/server` contient l'ensemble de l'application coté serveur, à savoir l'API Node Express.
- Le dossier `/shared` contient le code partagé entre l'ui et le server
- Le dossier `/ui` contient l'ensemble de l'application coté front, à savoir le code NextJs.
- Le fichier `/docker-compose.yml` va définir la configuration des services de l'application, _pour plus d'informations sur Docker cf: https://docs.docker.com/_

## Git Flow et Déploiements

Ce projet utilise un Git Flow avec deux branches principales pour séparer les environnements de test et de production.

### Architecture des branches

| Branche       | Rôle                             | Déploiements                | Versioning                | Protection       |
| ------------- | -------------------------------- | --------------------------- | ------------------------- | ---------------- |
| **`recette`** | Branche d'intégration et de test | Auto vers recette + pentest | Non                       | Oui (PR requise) |
| **`main`**    | Branche production-ready         | Manuel uniquement           | Oui (semantic versioning) | Oui (PR requise) |

**Branches de travail temporaires** :

- `feat/*` : Développement de nouvelles fonctionnalités (supprimées après merge)
- `fix/*` : Corrections de bug et corrections urgentes (hotfix) (supprimées après merge)

**Environnements disponibles** :

- **Recette** : Environnement de test et d'intégration
- **Pentest** : Environnement pour les tests de sécurité (synchronisé avec recette)
- **Production** : Environnement de production accessible aux utilisateurs

### Workflow de développement

#### 1. Créer une nouvelle fonctionnalité

Toutes les nouvelles fonctionnalités partent de la branche `recette` :

```bash
# 1. Se placer sur recette et récupérer les derniers changements
git checkout recette
git pull origin recette

# 2. Créer une branche de fonctionnalité
git checkout -b feature/ma-nouvelle-fonctionnalite

# 3. Développer et commiter
git add .
git commit -m "feat: ajout de ma nouvelle fonctionnalité"

# 4. Pousser la branche
git push -u origin feature/ma-nouvelle-fonctionnalite
```

**Ensuite** :

1. Créer une Pull Request vers `recette` sur GitHub
2. Attendre la validation des tests automatiques
3. Faire reviewer la PR par un membre de l'équipe
4. Merger la PR

**Résultat** : Après le merge, un déploiement automatique est déclenché vers les environnements **recette** et **pentest**.

#### 2. Conventions de nommage des commits et PR

Le projet utilise [Conventional Commits](https://www.conventionalcommits.org/). Les titres de PR doivent respecter ce format :

```
<type>(<scope>): <description>
```

#### 3. Promotion vers production

Une fois les fonctionnalités validées en recette, elles peuvent être promues vers production :

```bash
# 1. Créer une PR de recette vers main
# Via l'interface GitHub : recette → main

# 2. Après merge sur main :
# - Une release est automatiquement créée avec un numéro de version (ex: v1.5.0)
# - Les images Docker sont buildées et taggées avec cette version
# - AUCUN déploiement automatique n'est effectué

# 3. Déployer manuellement en production
# Via GitHub Actions > _deploy.yml > Run workflow
# ou via la CLI : .bin/mna-lba deploy production
```

### Déploiements

#### Déploiements automatiques

**Branche `recette`** :

- ✅ Déploiement automatique vers **recette** à chaque push
- ✅ Déploiement automatique vers **pentest** à chaque push
- 📦 Images Docker taggées avec le SHA du commit : `recette-abc1234`

**Exemple** :

```bash
# Après merge d'une PR vers recette
→ Build de ghcr.io/mission-apprentissage/mna_lba_server:recette-f207abf
→ Build de ghcr.io/mission-apprentissage/mna_lba_ui:recette-f207abf
→ Déploiement automatique vers recette
→ Déploiement automatique vers pentest
```

#### Déploiements manuels

**Branche `main`** :

- ❌ Aucun déploiement automatique
- 📦 Images Docker taggées avec version sémantique : `1.5.0`
- 🚀 Déploiement manuel uniquement

**Déclencher un déploiement production** :

1. Via GitHub Actions UI :
   - Aller dans "Actions" > "Deployment"
   - Cliquer sur "Run workflow"
   - Sélectionner `environment: production`
   - Sélectionner `app_version: latest` (ou une version spécifique)

2. Via ligne de commande :
   ```bash
   .bin/mna-lba deploy production --extra-vars "app_version=1.5.0"
   ```

### Gestion des hotfixes

Pour les corrections urgentes en production :

#### 1. Créer un hotfix

```bash
# 1. Partir de main (code en production)
git checkout main
git pull origin main

# 2. Créer une branche hotfix
git checkout -b hotfix/correction-bug-critique

# 3. Faire la correction
git add .
git commit -m "fix: correction du bug critique sur l'authentification"

# 4. Pousser et créer une PR vers main
git push -u origin hotfix/correction-bug-critique
```

#### 2. Workflow de synchronisation automatique

**Après merge du hotfix sur `main`** :

1. Une release est automatiquement créée
2. Un workflow automatique crée une PR `main → recette` avec le titre : `sync(main → recette): <titre du hotfix>`
3. Cette PR doit être reviewée et mergée manuellement pour synchroniser recette

**Exemple** :

```
Hotfix: fix(auth): correction authentification SSO
  ↓ merge sur main
  ↓ Release v1.5.1 créée automatiquement
  ↓ PR automatique créée: "sync(main -> recette): fix(auth): correction authentification SSO"
  ↓ Review + merge manuel
  ↓ recette synchronisée avec le hotfix
```

#### 3. Déployer le hotfix en production

```bash
# Déploiement manuel du hotfix
.bin/mna-lba deploy production --extra-vars "app_version=1.5.1"
```

### Schéma récapitulatif

```
┌─────────────────────────────────────────────────────────────┐
│                    Cycle de développement                    │
└─────────────────────────────────────────────────────────────┘

  feature/nouvelle-fonction
           │
           │ (PR + Review)
           ↓
       recette ──────────────→ Auto-deploy vers recette + pentest
           │                   (images: recette-abc1234)
           │
           │ (PR + Review après validation)
           ↓
         main ──────────────→ Release automatique (v1.5.0)
           │                   Build images versionnées
           │                   PAS de déploiement auto
           │
           │ (Déploiement manuel)
           ↓
      production


┌─────────────────────────────────────────────────────────────┐
│                      Cycle hotfix                            │
└─────────────────────────────────────────────────────────────┘

  hotfix/bug-critique
           │
           │ (PR + Review)
           ↓
         main ──────────────→ Release automatique (v1.5.1)
           │                   PR auto vers recette créée
           │
           ├──→ (Déploiement manuel)
           │    production
           │
           └──→ (PR auto: sync)
                recette ────→ Review + merge manuel pour sync
```

### Règles importantes

- ✅ Toujours créer une branche depuis `recette` pour les nouvelles fonctionnalités
- ✅ Toujours passer par une Pull Request (jamais de push direct sur `recette` ou `main`)
- ✅ Respecter les conventions de nommage des commits (Conventional Commits)
- ✅ Attendre les validations automatiques (tests, linter) avant de merger
- ✅ Pour les hotfixes urgents, partir de `main` avec une branche `hotfix/*`
- ❌ Ne jamais forcer un push sur `recette` ou `main` (`git push --force`)
- ❌ Ne jamais merger une PR sans review

## Opérations

Veuillez consulter le [README](../README.md#développement) principal pour le démarrage.

### Installation et Mise à jour des dépendences

Pour installer et mettre à jour les dépendences, vous pouvez au choix:

- Modifier les différents `package.json` et appliquer les changements via `yarn install`
- Ajouter des dépendences via la commande `yarn add -E`

## Linter

Un linter (via ESLint) est mis en place dans le projet, pour le lancer :

```bash
yarn lint
```

**Note:** eslint est run automatiquement à chaque commit

## Prettier

Prettier est mis en place dans le projet, pour le lancer :

```bash
yarn prettier:fix
```

**Note:** eslint est run automatiquement à chaque commit

## Typescript

L'application utilise TypeScript, pour vérifier que les erreurs liés au type veuillez lancer:

```bash
yarn typecheck
```

### Arrêt des services

Il est possible de stopper les services en lancant la commande suivante :

```bash
yarn services:stop
```

### Suppression des services

Pour supprimer l'ensemble des services et tuer tous les conteneurs il suffit de lancer la commande suivante :

```bash
yarn services:clean
```

#### Server CLI

La `cli` du server s'éxécute sur le fichier compilé `server/dist/index.js` ainsi il est nécéssaire de:

- soit avoir la commande `dev` lancée pour watch les changements
- soit build avec la commande `build:dev` dans `/server`

Commandes:

- `yarn cli --help`: List l'ensemble des commandes disponibles
- `yarn cli seed`: Seed de la database
- `yarn cli migrations:status`: Vérification du status des migrations
- `yarn cli migrations:up`: Execution des migrations
- `yarn cli migrations:create`: Creation d'une nouvelle migration

### Emails

Le server SMTP de test [Mailpit](https://github.com/axllent/mailpit) est utilisé localement pour prendre en charge l'envoi d'emails localement.

Vous pouvez accéder à l'interface utilisateur à l'addresse suivante [http://localhost:8025](http://localhost:8025).

### Debugger sous VSCode

Il est possible de débugger facilement **sous VSCode** grace à la configuration Vscode partagée.

#### Server Inspect

- Lancer la task `Attach Server`
- Lancer l'application en utilisant la commande `make debug` au lieu de `make start`.
