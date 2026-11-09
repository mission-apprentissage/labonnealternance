#!/usr/bin/env bash
# Démarre mongodb (replica set) puis mongot pour le job de tests, et écrit son code de sortie dans
# le fichier passé en argument : le workflow le lance en tâche de fond et attend ce fichier.
set -euo pipefail

done_file="$1"
trap 'echo $? > "$done_file"' EXIT

docker compose up --build -d --wait mongodb
docker compose exec -T mongodb mongosh --eval "try { rs.status().ok } catch (e) { if (e.code === 94) {rs.initiate();} else {throw e} }" --quiet

# mongot (MongoDB Search) : nécessaire aux tests du contrôleur /v1/search, sans lui $search échoue.
# Mot de passe jetable généré pour le job (aucun secret requis).
openssl rand -hex 24 > .infra/local/mongot_password
chmod 600 .infra/local/mongot_password
docker compose exec -T -e MONGOT_VALUE="$(cat .infra/local/mongot_password)" mongodb mongosh \
  "mongodb://__system:password@localhost:27017/admin?authSource=local&directConnection=true" \
  --eval 'db.createUser({ user: "mongotUser", pwd: process.env.MONGOT_VALUE, roles: ["searchCoordinator"] })' --quiet
docker compose up --build -d --wait mongot
# Le healthcheck mongot répond SERVING avant que le canal $search de mongod soit
# opérationnel : sonde sur le chemin réel jusqu'à ce qu'un $search aboutisse.
docker compose exec -T mongodb mongosh \
  "mongodb://__system:password@localhost:27017/ci_probe?authSource=local&directConnection=true" \
  --eval 'let ok = false; for (let i = 0; i < 45 && !ok; i++) { try { db.probe.aggregate([{ $search: { index: "probe", exists: { path: "x" } } }]).toArray(); ok = true } catch (e) { sleep(2000) } } if (!ok) throw new Error("canal $search indisponible après 90s")' --quiet
