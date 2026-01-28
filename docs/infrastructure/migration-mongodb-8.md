# Migration MongoDB 7 → 8.2.3 (Environnement Local)

## Contexte

Le projet a migré de MongoDB 7.0 vers MongoDB 8.2.3. Cette documentation explique comment les développeurs doivent mettre à jour leur environnement local après avoir récupéré les changements.

## Version actuelle

- **MongoDB**: 8.2.3
- **Feature Compatibility Version (FCV)**: 8.2
- **Configuration**: Replica set `replica` (1 membre)

## Impact pour les développeurs

Après un `git pull`, le Dockerfile MongoDB local ([.infra/local/Dockerfile.mongod](../../.infra/local/Dockerfile.mongod)) utilisera désormais l’image `mongodb/mongodb-community-server:8.2.3-ubuntu2204`. Votre environnement local nécessite une mise à jour.

---

## Option 1 : Reset complet (Recommandé pour dev local)

Cette option supprime toutes vos données locales MongoDB et repart avec une base vide.

### Avantages

- ✅ Simple et rapide (5 minutes)
- ✅ Pas de risque de conflit de version
- ✅ Base propre et à jour

### Procédure

```bash
# 1. Arrêter et supprimer les conteneurs
docker-compose down

# 2. Supprimer le volume MongoDB (vos données locales seront perdues)
docker volume rm lba_mongodb_data

# 3. Redémarrer l'environnement avec MongoDB 8.2.3
yarn dev

# 4. (Optionnel) Restaurer les données de seed
yarn seed
```

**Note**: Si vous avez des données locales importantes, sauvegardez-les avant avec :

```bash
docker exec labonnealternance-mongodb-1 mongodump --archive=/tmp/backup.archive --gzip
docker cp labonnealternance-mongodb-1:/tmp/backup.archive ./mongodb-backup.archive
```

---

## Option 2 : Migration progressive (Conservation des données)

Cette option préserve vos données locales et effectue une migration en place.

### Avantages

- ✅ Conserve vos données locales
- ✅ Migration conforme aux recommandations MongoDB

### Inconvénients

- ⚠️ Plus complexe
- ⚠️ Nécessite 2 migrations successives (7→8.0→8.2)
- ⚠️ ~15 minutes

### Prérequis

Vérifier que vous êtes bien en MongoDB 7.x :

```bash
docker exec labonnealternance-mongodb-1 mongosh --eval "db.version()"
```

### Procédure

#### Étape 1 : Vérifier l'état actuel

```bash
# Vérifier le FCV (doit être 7.0)
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval 'db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 })'

# Vérifier la santé du replica set
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval 'rs.status()'
```

#### Étape 2 : Migration vers 8.0

```bash
# Modifier le Dockerfile temporairement
sed -i '' 's/FROM mongo:8.2.3/FROM mongo:8.0/' .infra/local/Dockerfile

# Arrêter proprement MongoDB
docker-compose stop mongodb

# Rebuild et redémarrer
docker-compose build mongodb
docker-compose up -d mongodb

# Attendre que le service soit healthy
sleep 15

# Réinitialiser le replica set si nécessaire
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval "try { rs.status().ok } catch (e) { if (e.code === 94) {rs.initiate();} else {throw e} }"

# Activer FCV 8.0
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval 'db.adminCommand({ setFeatureCompatibilityVersion: "8.0", confirm: true })'
```

#### Étape 3 : Migration vers 8.2.3

```bash
# Restaurer le Dockerfile vers 8.2.3
sed -i '' 's/FROM mongo:8.0/FROM mongo:8.2.3/' .infra/local/Dockerfile

# Arrêter proprement MongoDB
docker-compose stop mongodb

# Rebuild et redémarrer
docker-compose build mongodb
docker-compose up -d mongodb

# Attendre que le service soit healthy
sleep 15

# Réinitialiser le replica set si nécessaire
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval "try { rs.status().ok } catch (e) { if (e.code === 94) {rs.initiate();} else {throw e} }"

# Activer FCV 8.2
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval 'db.adminCommand({ setFeatureCompatibilityVersion: "8.2", confirm: true })'
```

#### Étape 4 : Vérification finale

```bash
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval 'print("MongoDB version: " + db.version()); print("FCV: " + JSON.stringify(db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 }).featureCompatibilityVersion)); print("Replica set: " + (rs.status().ok ? "OK" : "FAILED"))'
```

Résultat attendu :

```
MongoDB version: 8.2.3
FCV: {"version":"8.2"}
Replica set: OK
```

---

## Vérification post-migration

Après la migration (quelle que soit l'option choisie), vérifiez que tout fonctionne :

```bash
# Démarrer l'environnement complet
yarn dev

# Dans un autre terminal, vérifier la connexion
yarn cli migrations:status

# Tester l'application
open http://localhost:3000
```

---

## Résolution de problèmes

### Erreur "MongoServerError: not authorized"

Vérifiez que vous utilisez les bonnes credentials :

```bash
# Les credentials par défaut sont dans server/.env
LBA_MONGODB_URI=mongodb://__system:password@127.0.0.1:27017/labonnealternance?authSource=local&directConnection=true
```

### Le replica set ne s'initialise pas

Réinitialisez-le manuellement :

```bash
docker exec labonnealternance-mongodb-1 mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval 'rs.initiate()'
```

### MongoDB ne démarre pas après la migration

Option de dernier recours - reset complet :

```bash
docker-compose down
docker volume rm lba_mongodb_data
yarn dev
yarn seed
```

---

## Informations techniques

### Pourquoi 2 migrations (7→8.0→8.2) ?

MongoDB ne permet pas de sauter des versions majeures. Le chemin de migration officiel est :

- MongoDB 7.0 → 8.0 (activation FCV 8.0)
- MongoDB 8.0 → 8.2 (activation FCV 8.2)

### Qu'est-ce que le FCV (Feature Compatibility Version) ?

Le FCV contrôle quelles fonctionnalités sont activées dans MongoDB. Même si vous utilisez MongoDB 8.2, vous pouvez garder le FCV à 7.0 pour maintenir la compatibilité descendante.

L'activation du FCV 8.2 permet d'utiliser les nouvelles fonctionnalités de MongoDB 8.2, mais rend impossible un downgrade vers une version antérieure sans support MongoDB.

### Persistance des données

Les données MongoDB sont stockées dans le volume Docker `lba_mongodb_data` :

- ✅ Persistant entre les redémarrages de conteneur
- ✅ Compatible entre versions MongoDB (avec migration FCV)
- ⚠️ Supprimé avec `docker volume rm lba_mongodb_data`

---

## Ressources

- [Documentation officielle MongoDB 8.0](https://www.mongodb.com/docs/manual/release-notes/8.0/)
- [Documentation officielle MongoDB 8.2](https://www.mongodb.com/docs/manual/release-notes/8.2/)
- [Guide de migration Replica Set vers 8.2](https://www.mongodb.com/docs/manual/release-notes/8.2-upgrade-replica-set/)

---

## Support

En cas de problème, contactez l'équipe infrastructure ou ouvrez une issue sur le repository.
