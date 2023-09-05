# Développement

- [Développement](#développement)
  - [Organisation des dossiers](#organisation-des-dossiers)
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
