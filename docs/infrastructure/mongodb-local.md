# MongoDB Local avec Atlas Search

Ce document décrit l'installation locale de MongoDB avec support Atlas Search via mongot.

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

**Composants :**

- **mongodb** : MongoDB Community Server 8.2.3 avec paramètres search activés
- **mongot** : Moteur de recherche Atlas Search (Lucene-based)

## Fichiers de configuration

| Fichier                          | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| `.infra/local/Dockerfile.mongod` | Image mongodb avec config personnalisée            |
| `.infra/local/Dockerfile.mongot` | Image mongot avec password file                    |
| `.infra/local/mongod.conf`       | Configuration mongod (replica set + search params) |
| `.infra/local/mongot.yml`        | Configuration mongot (sync source, gRPC)           |
| `.infra/local/mongot_password`   | Password pour l'utilisateur mongotUser             |
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

## Démarrage

### Premier lancement (volumes vides)

```bash
# 1. Démarrer les services
docker-compose up -d mongodb mongot

# 2. Attendre que mongodb soit healthy
docker-compose ps

# 3. Initialiser le replica set
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/?authSource=local&directConnection=true" \
  --eval 'rs.initiate()'

# 4. Créer l'utilisateur mongotUser
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval 'db.createUser({ user: "mongotUser", pwd: "mongotPassword", roles: ["searchCoordinator"] })'

# 5. Redémarrer mongot pour qu'il se connecte
docker-compose restart mongot
```

### Lancement standard (volumes existants)

```bash
docker-compose up -d mongodb mongot
```

## Vérification

### Status des services

```bash
docker-compose ps
```

Résultat attendu :

```
NAME                          STATUS
labonnealternance-mongodb-1   Up (healthy)
labonnealternance-mongot-1    Up (healthy)
```

### Health check mongot

```bash
docker exec labonnealternance-mongot-1 curl -s localhost:8080/health
```

Résultat attendu : `{"status":"SERVING"}`

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

## Troubleshooting

### mongot redémarre en boucle

**Cause probable :** Replica set non initialisé ou utilisateur mongotUser manquant.

**Solution :**

```bash
# Vérifier les logs
docker-compose logs mongot --tail 50

# Réinitialiser si nécessaire
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/?authSource=local&directConnection=true" \
  --eval 'rs.status()'
```

### Erreur "REPLICA_SET_GHOST"

**Cause :** Le replica set n'est pas initialisé.

**Solution :**

```bash
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/?authSource=local&directConnection=true" \
  --eval 'rs.initiate()'
```

### Erreur de permissions password file

**Cause :** Le fichier password a des permissions trop permissives.

**Solution :** Utiliser le Dockerfile.mongot qui gère les permissions correctement.

## Reset complet

```bash
# Arrêter et supprimer les volumes
docker-compose down -v

# Rebuild les images
docker-compose build mongodb mongot

# Redémarrer (suivre les étapes "Premier lancement")
docker-compose up -d mongodb mongot
```

## Notes techniques

- **Image mongod** : `mongodb/mongodb-community-server:8.2.3-ubuntu2204`
- **Image mongot** : `mongodb/mongodb-community-search:0.60.1`
- **Ports internes** :
  - MongoDB : 27017
  - mongot gRPC : 27028
  - mongot health : 8080
  - mongot metrics : 9946
- **Utilisateur search** : `mongotUser` avec rôle `searchCoordinator`
- **Authentification** : Désactivée entre mongod et mongot en local (`skipAuthenticationToSearchIndexManagementServer: true`)

## Gestion des secrets

### Local (développement)

Les fichiers de secrets sont en clair pour simplifier le développement :

| Fichier                        | Contenu          |
| ------------------------------ | ---------------- |
| `.infra/local/mongo_keyfile`   | `password`       |
| `.infra/local/mongot_password` | `mongotPassword` |

### Déployé (preview/production)

Les secrets sont gérés via Ansible Vault :

| Template                                           | Variable Vault              | Destination                                    |
| -------------------------------------------------- | --------------------------- | ---------------------------------------------- |
| `.infra/files/configs/mongodb/mongo_keyfile.txt`   | `{{vault.MONGODB_KEYFILE}}` | `/opt/app/configs/mongodb/mongo_keyfile.txt`   |
| `.infra/files/configs/mongodb/mongot_password.txt` | `{{vault.MONGOT_PASSWORD}}` | `/opt/app/configs/mongodb/mongot_password.txt` |

Les fichiers sont générés avec les permissions `400` (lecture seule par le propriétaire) lors du déploiement Ansible.
