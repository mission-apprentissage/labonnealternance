# Gestion de l'infrastructure

- [Gestion de l'infrastructure](#gestion-de-linfrastructure)
  - [Prérequis](#prérequis)
    - [SSH](#ssh)
    - [GPG](#gpg)
    - [Provision du server](#provision-du-server)
    - [Déclaration de l'environnement](#déclaration-de-lenvironnement)
  - [Release](#release)
    - [Release Application](#release-application)
    - [Release Manuellement](#release-manuellement)
  - [Deploiement de l'application](#deploiement-de-lapplication)
  - [Gestion des secrets](#gestion-des-secrets)
  - [Operations sur le serveur](#operations-sur-le-serveur)

## Prérequis

### SSH

Pour avoir accès aux serveurs, vous devez avoir une clé SSH, si ce n'est pas le cas, vous pouvez suivre le tutorial
suivant : https://docs.github.com/en/authentication/connecting-to-github-with-ssh

Cette clé devra etre ajoutée sur [votre profile Github](https://github.com/settings/keys) et communiquée à votre èquipe afin que vos accès au serveur soient créés.

### GPG

Veuillez suivre les instructions dans le [README principal](../../README.md#gpg)

### Provision du server

TODO: See infra repo

### Déclaration de l'environnement

Le fichier `/env.ini` définit les environnements de l'application. Il faut donc ajouter le nouvel environnement
dans ce fichier en renseignant les informations suivantes :

```ini
[<nom de l'environnement>]
<IP>
[<nom de l'environnement>:vars]
dns_name=tdb-<nom de l'environnement>.apprentissage.beta.gouv.fr
host_name=tdb-<nom de l'environnement>
env_type=recette
```

Pour information, vous pouvez obtenir l'adresse ip du vps en consultant les emails de
service : https://www.ovh.com/manager/dedicated/#/useraccount/emails

Editer le vault pour créer les env-vars liés à ce nouvel environnement (cf: [Edition du vault](#edition-du-vault))

Vous pouvez maintenant poursuivre avec le [Deploiement de l'application](#deploiement-de-lapplication).

## Release

### Release Application

La création de release dépend de l'etat local de votre environnement, il est recommandé d'utiliser les releases créés automatiquement pour tout commit sur `master` via la Github Action `Release version`.

Si vous souhaitez effectuer une release manuelle veuillez vous référé à la section suivante.

### Release Manuellement

Pour créer une nouvelle version stable veuillez utiliser la commande suivante:

```bash
yarn release:interactive
```

## Deploiement de l'application

See [Deployment](../deploy.md)

## Gestion des secrets

See [Vault](../Vault.md)

## Operations sur le serveur

Il est parfois nécessaire de se connecter directement au serveur pour executer certaines operations de maintenance:

> TODO: see infra
