![](https://avatars1.githubusercontent.com/u/63645182?s=200&v=4)

# LBA - La bonne alternance

- [LBA - La bonne alternance](#lba---la-bonne-alternance)
  - [Fiche Produit](#fiche-produit)
  - [Installation](#installation)
    - [Pré-requis](#pré-requis)
    - [Clé GPG](#clé-gpg)
  - [Développement](#développement)
    - [Gettting started](#gettting-started)
    - [Détails des commandes globales](#détails-des-commandes-globales)
      - [Installation .env](#installation-env)
      - [Lancement de la stack compléte](#lancement-de-la-stack-compléte)
      - [CLI mna-lba](#cli-mna-lba)
      - [Lancement de l'application](#lancement-de-lapplication)
      - [Gestion des services docker](#gestion-des-services-docker)
      - [Hydratation du projet en local](#hydratation-du-projet-en-local)
      - [Deploiement depuis l'environnement local](#deploiement-depuis-lenvironnement-local)
      - [Gestion des migrations](#gestion-des-migrations)
      - [Talisman](#talisman)
      - [Vault](#vault)
      - [Linter](#linter)
      - [Release depuis l'environnement local](#release-depuis-lenvironnement-local)
    - [Variables d'environnement local](#variables-denvironnement-local)
    - [Exécution des tests](#exécution-des-tests)
      - [Snapshots](#snapshots)
  - [Aller plus loin](#aller-plus-loin)

## Fiche Produit

Consultez la [Fiche Produit](https://beta.gouv.fr/startups/la-bonne-alternance.html) pour plus d'informations sur le projet.

## Installation

### Pré-requis

Avant d'installer le projet, assurez-vous d'avoir les éléments suivants :

- **Bash** 5+
- **Docker** 23.03.0+
- **Git LFS**
- **GnuPG**
- **pwgen**
- **1password-cli**
- **yq**
- **shred**
- **sshpass**
- **NodeJS** 20+
- **Ansible** 2.7+

#### Installation des pré-requis sur un environnement **MacOS** :

```bash
brew install n
brew install yq
brew install coreutils
brew install git-lfs
brew install 1password-cli
brew install ansible
brew install pwgen
brew install bash
```

```bash
brew tap esolitos/ipa
brew install esolitos/ipa/sshpass
```

### Clé GPG

Pour décrypter les variables d'environnement, vous avez besoin d'une clé GPG. Si vous n'en avez pas, vous pouvez en créer une en suivant la documentation GitHub [ici](https://docs.github.com/fr/authentication/managing-commit-signature-verification/generating-a-new-gpg-key).

Voici les étapes pour créer votre clé GPG :

1. Lors de la création de la clé, choisissez les options suivantes :
   - `Please select what kind of key you want` > `ECC (sign and encrypt)`
   - `Please select which elliptic curve you want` > `Curve 25519`
   - `Please specify how long the key should be valid` > `0`
   - `Real Name`: `<Prenom> <Nom>`
   - `Email Address`: `email@mail.gouv.fr`

2. Pour utiliser votre clé au sein du projet, publiez-la en exécutant la commande suivante :

   ```bash
   gpg --list-secret-keys --keyid-format=long
   ```

   L'identifiant de votre clé correspond à la valeur `sec ed25519/<identifiant>`.

3. Pour utiliser votre clé au sein de la mission apprentissage, vous devez la publier en exécutant la commande suivante :

   ```bash
   gpg --send-key <identifiant>
   ```

4. Pour une meilleure sécurité, il est recommandé de sauvegarder les clés publique et privée nouvellement créées. Vous pouvez les exporter en exécutant les commandes suivantes :

   ```bash
   gpg --export <identifiant> > public_key.gpg
   gpg --export-secret-keys <identifiant> > private_key.gpg
   ```

   Ces deux fichiers peuvent être sauvegardés, par exemple, sur une clé USB.

5. Communiquez votre clé à votre équipe afin d'être autorisé à décrypter le vault.

**Une fois autorisé, vous aurez accès aux fichiers suivants :**

- `.infra/vault/.vault-password.gpg`

6. Installer 1password cli et connecter votre compte

- brew install 1password-cli https://developer.1password.com/docs/cli/get-started/

## Développement

### Gettting started

Avant de lancer l'application, assurez-vous d'installer toutes les dépendances nécessaires en exécutant la commande suivante :

```bash
yarn
yarn setup
```

Cette commande mettra à jour les dépendances du projet.

Le script vous demandera plusieurs fois la phrase secrète de votre clé GPG pour décrypter les variables d'environnement du vault.

Il est possible que vous rencontriez un problème avec le fichier `.infra/local/mongo_keyfile` lors du démarrage du container de `mongodb` (vous auriez des erreurs dans les logs du démarrage du container).

Si c'est le cas, vérifiez que les droits du ficher sont bien `440` pour MacOS et `400` pour Linux et que le fichier appartient à l'utilisateur lançant `docker`.

```bash
yarn dev
yarn seed
```

Vous pouvez maintenant accéder à l'application via l'URL [http://localhost:3000](http://localhost:3000)

Vous pouvez maintenant accéder à l'API via l'URL [http://localhost:5001](http://localhost:5000)

Vous pouvez maintenant accéder au SMTP via l'URL [http://localhost:8025](http://localhost:8025)

### Détails des commandes globales

Les principales opérations sont regroupées dans le `package.json`.

#### Installation .env

```bash
  yarn setup
```

installation ou mise à jour de vos fichiers d'environnement de développement depuis le vault.yml (`server/.env` et `ui/.env`)

#### Lancement de la stack compléte

Pour démarrer l'application en mode local, exécutez la commande suivante :

```bash
  yarn dev
```

Lance la stack local de développement (server, ui, services)

Cette commande démarre les containers définis dans le fichier `docker-compose.yml`.

#### CLI mna-lba

```bash
  yarn cli <command>
```

commande pour lancer les commandes du cli mna-lba

#### Lancement de l'application

```bash
  yarn server:dev
```

Lance le server en dev indépendamment de la stack

```bash
  yarn ui:dev
```

Lance l'ui en dev indépendamment de la stack

#### Gestion des services docker

Lance les services docker en local

```bash
  yarn services:start
```

---

Stopper les services docker en local

```bash
  yarn services:stop
```

---

Supprimer les services docker en local

```bash
  yarn services:clean
```

#### Hydratation du projet en local

```bash
  yarn seed <OPTIONAL:DB_URL>
```

Pour créer des jeux de test facilement il suffit de lancer les commandes suivante.
Applique la base de données seed sur la base de données cible (par défaut la base de données locale)

---

Mise à jour de la base de données seed depuis votre local

```bash
  yarn seed:update
```

#### Deploiement depuis l'environnement local

Deploie l'application sur l'environnement cible

```bash
  yarn deploy <environnement> <OPTIONAL:--user USERNAME>
```

> TODO: Optional only if 1password is configured

#### Gestion des migrations

Cli pour créer une migration

```bash
  yarn migration:create -d <name>
```

#### Talisman

Ajouter une exception à talisman

```bash
  yarn talisman:add-exception
```

#### Vault

Édition du vault ansible

```bash
  yarn vault:edit
```

#### Linter

Lint global du projet

```bash
  yarn lint
```

#### Release depuis l'environnement local

Création d'une release

```bash
  yarn release:interactive
```

### Variables d'environnement local

Les variables d'environnement local du server sont stocké dans le vault (peut contenir des secrets). Si vous souhaitez overwwrite certaines variables ou changer le port de l'api par exemple, il est possible de créer un fichier `server/.env.local` et `ui/.env.local`

### Exécution des tests

Pour exécuter les tests localement, utilisez la commande suivante :

```bash
yarn test
```

Cette commande exécutera tous les tests du projet et vous affichera les résultats.

**Assurez-vous:**

1. D'avoir installé toutes les dépendances via la commande `yarn install` avant de lancer les tests

2. D'avoir lancé l'application car les tests utilisent la base de donnée.

### Exécution des tests cypress

Charger les variables d'environnement :

```bash
export $(cat cypress.env|xargs)
```

Pour ouvrir cypress localement, utilisez la commande suivante :

```bash
yarn e2e
```

Pour executer cypress sur les environnements spécifiques :

```bash
yarn e2e:production
yarn e2e:recette
```

#### Snapshots

Pour mettre à jour les snapshots, utilisez la commande suivante dans `/shared`

```bash
yarn test --update
```

## Aller plus loin

- [Datasouces](./docs/DATASOURCES.md)
- [Vault](./docs/Vault.md)
- [Déploiement](./docs/deploy.md)
- [Développement](./docs/developpement/developpement.md)
- [Debugging](./docs/developpement/debug.md)
- [Infrastructure](./docs/infrastructure.md)
- [Sécurité](./docs/securite.md)
