# MongoDB avec Atlas Search

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose                          │
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────────┐  │
│  │      mongodb        │      │         mongot          │  │
│  │                     │      │                         │  │
│  │  mongodb-community- │◄────►│  mongodb-community-     │  │
│  │  server:8.2.3       │ gRPC │  search:0.60.1          │  │
│  │                     │:27028│                         │  │
│  │  Port: 27017        │      │  Health: 8080           │  │
│  └─────────────────────┘      └─────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **mongodb** : MongoDB Community Server 8.2.3 avec paramètres search activés
- **mongot** : Moteur de recherche Atlas Search (Lucene-based)

## Fichiers de configuration

| Fichier                          | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| `.infra/local/Dockerfile.mongod` | Image mongodb avec config personnalisée            |
| `.infra/local/Dockerfile.mongot` | Image mongot avec password file                    |
| `.infra/local/mongod.conf`       | Configuration mongod (replica set + search params) |
| `.infra/local/mongot.yml`        | Configuration mongot (sync source, gRPC)           |
| `.infra/local/mongot_password`   | Password en clair pour l'utilisateur mongotUser (référence à la variable SOPS `MONGOT_PASSWORD`) |
| `docker-compose.yml`             | Orchestration des services                         |

## Paramètres clés

### mongod.conf

```yaml
setParameter:
  searchIndexManagementHostAndPort: mongot:27028
  mongotHost: mongot:27028
  skipAuthenticationToSearchIndexManagementServer: true
  useGrpcForSearch: true
```

### mongot.yml

```yaml
syncSource:
  replicaSet:
    hostAndPort: "mongodb:27017"
    username: mongotUser
    passwordFile: "/etc/mongot/secrets/passwordFile"

server:
  grpc:
    address: "0.0.0.0:27028"
```

---

## Environnement local (développeur)

### Premier lancement

Si vous avez déjà des volumes MongoDB d'une version précédente, supprimez-les d'abord :

```bash
docker-compose down
docker volume rm lba_mongodb_data
```

Puis lancez le setup :

```bash
yarn setup
```

`yarn setup` prend en charge l'initialisation complète : démarrage des services, initialisation du replica set, création de l'utilisateur `mongotUser` (mot de passe lu depuis SOPS), redémarrage de mongot, migrations et recréation des index.

### Lancement standard (volumes existants)

```bash
docker-compose up -d mongodb mongot
```

### Vérification

```bash
docker-compose ps
```

Résultat attendu :

```
NAME                          STATUS
labonnealternance-mongodb-1   Up (healthy)
labonnealternance-mongot-1    Up (healthy)
```

```bash
docker exec labonnealternance-mongot-1 curl -s localhost:8080/health
```

Résultat attendu : `{"status":"SERVING"}`

## Serveurs (preview/production)

### Gestion des secrets

Les secrets sont chiffrés dans `env.global.yml` via SOPS et déployés par Ansible :

| Template                                           | Variable SOPS           | Destination                                    |
| -------------------------------------------------- | ----------------------- | ---------------------------------------------- |
| `.infra/files/configs/mongodb/mongo_keyfile.txt`   | `{{ MONGODB_KEYFILE }}` | `/opt/app/configs/mongodb/mongo_keyfile.txt`   |
| `.infra/files/configs/mongodb/mongot_password.txt` | `{{ MONGOT_PASSWORD }}` | `/opt/app/configs/mongodb/mongot_password.txt` |

Les fichiers sont générés avec les permissions `400` (lecture seule par le propriétaire) lors du déploiement Ansible.

### FCV (Feature Compatibility Version)

Le FCV contrôle quelles fonctionnalités sont activées. En production, il doit correspondre à la version MongoDB déployée.

Version actuelle : **8.2**

```bash
# Vérifier le FCV d'un serveur
mongosh --eval 'db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 })'
```

**Attention :** Une fois le FCV mis à jour vers une version majeure, le downgrade vers la version précédente n'est plus possible sans support MongoDB. MongoDB ne permet pas de sauter des versions majeures lors d'une migration (ex : 7.0 → 8.0 → 8.2).

---

## Test rapide Atlas Search

### 1. Créer des données de test

```bash
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/test?authSource=local&directConnection=true" \
  --eval '
db.articles.insertMany([
  { title: "MongoDB Atlas Search", content: "Full text search with Lucene" },
  { title: "Vector Search Guide", content: "Semantic search using vectors" }
]);
'
```

### 2. Créer un index de recherche

```bash
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/test?authSource=local&directConnection=true" \
  --eval '
db.articles.createSearchIndex({
  name: "test_search_index",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        title: { type: "string" },
        content: { type: "string" }
      }
    }
  }
});
'
```

### 3. Exécuter une requête $search

```bash
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/test?authSource=local&directConnection=true" \
  --eval '
db.articles.aggregate([
  {
    $search: {
      index: "test_search_index",
      text: {
        query: "search",
        path: ["title", "content"]
      }
    }
  },
  {
    $project: {
      title: 1,
      score: { $meta: "searchScore" }
    }
  }
]);
'
```

Résultat attendu :

```javascript
[
  { _id: ObjectId('...'), title: 'Vector Search Guide', score: 0.169... },
  { _id: ObjectId('...'), title: 'MongoDB Atlas Search', score: 0.162... }
]
```

### 4. Nettoyer les données de test

```bash
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/test?authSource=local&directConnection=true" \
  --eval 'db.articles.drop()'
```

---

## Troubleshooting

### mongot redémarre en boucle / AuthenticationFailed

**Cause probable :** L'utilisateur `mongotUser` n'existe pas dans MongoDB (volumes réinitialisés sans relancer `yarn setup`).

**Solution :** Relancer `yarn setup`, ou créer l'utilisateur manuellement :

```bash
MONGOT_PWD=$(sops --decrypt --extract '["MONGOT_PASSWORD"]' .infra/env.global.yml)
docker compose exec mongodb mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval "db.createUser({ user: 'mongotUser', pwd: '${MONGOT_PWD}', roles: ['searchCoordinator'] })"
docker compose restart mongot
```

### Erreur "REPLICA_SET_GHOST"

**Cause :** Le replica set n'est pas initialisé.

**Solution :**

```bash
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/?authSource=local&directConnection=true" \
  --eval 'rs.initiate()'
```

### Erreur "MongoServerError: not authorized"

Les credentials par défaut sont dans `server/.env` :

```
LBA_MONGODB_URI=mongodb://__system:password@127.0.0.1:27017/labonnealternance?authSource=local&directConnection=true
```

### Erreur de permissions password file

**Cause :** Le fichier password a des permissions trop permissives.

**Solution :** Utiliser le `Dockerfile.mongot` qui gère les permissions correctement.

---

## Ressources

- [Documentation officielle MongoDB 8.2](https://www.mongodb.com/docs/manual/release-notes/8.2/)
- [Guide de migration Replica Set vers 8.2](https://www.mongodb.com/docs/manual/release-notes/8.2-upgrade-replica-set/)
