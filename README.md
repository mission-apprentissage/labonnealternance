# La bonne alternance

## 1. Pré-requis

- Node >= 18
- Yarn version 1
- Docker >= 19
- Docker-compose >= 1.27
- S'assurer qu'on a bien accès à 1Password
- Dans 1password s’assurer qu’on a bien accès au vault LBA
- Si volumes Docker existants et/ou installations Docker précédentes instables, on peut tout remettre à zéro avec "docker-compose kill && docker system prune --force --volumes" (attention aux pertes de données)
- sur Mac, s’assurer que Docker Desktop alloue suffisamment de ressources : CPUs: 6, Memory: 12GB, Swap: 3GB, Disk size image : 48GB. L'option est disponible sous Docker Desktop sous Preferences/Resources.
- Alimenter les .env dans les dossiers "server" et "ui_espace_pro" - demander de l'aide à l'équipe.

## 2. Démarrage

Pour créer l'application :

```sh
make install
make start
```

Cette commande démarre les containers définis dans le fichier `docker-compose.yml` et `docker-compose.override.yml`

Il est possible qu'il y ait une erreur mémoire à la fin du make start, relancer la commande - qui prendra beaucoup moins de temps cette fois-ci.

## 3. Provisions des données de référence

- “make seed”, tous les services Docker étant lancés.

## 4. Provision des données entreprises

- Cette partie est manquante pour l'instant.

## 5. Utiliser des bouchons

- En utilisant le query parameter "useMock=true" dans l'URL, des bouchons sont renvoyés pour les formations et les entreprises.

## 6. Accéder à l'UI en local

- l'application est accessible à l'url [http://localhost](http://localhost)

## 7. Accéder aux emails en local

- localhost/smtp (authentification HTTP simple)

![Marianne](https://avatars1.githubusercontent.com/u/63645182?s=200&v=4)
