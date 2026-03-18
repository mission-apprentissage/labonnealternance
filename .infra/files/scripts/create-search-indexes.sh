#!/usr/bin/env bash
# Crée les MongoDB Search indexes (nécessite mongot démarré).
# L'URI MongoDB est lue depuis LBA_MONGODB_URI ou décryptée depuis le fichier SOPS
# correspondant à l'environnement détecté via LBA_ENV (local par défaut).
#
# Usage :
#   ./scripts/create-search-indexes.sh
#   LBA_ENV=production ./scripts/create-search-indexes.sh
#   LBA_MONGODB_URI=mongodb://... ./scripts/create-search-indexes.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPT_DIR}/../.."

# Si LBA_MONGODB_URI n'est pas défini, le décrypter depuis le fichier SOPS de l'environnement
if [[ -z "${LBA_MONGODB_URI:-}" ]]; then
  ENV_NAME="${LBA_ENV:-local}"
  SOPS_FILE="${INFRA_DIR}/env.${ENV_NAME}.yml"

  if [[ ! -f "$SOPS_FILE" ]]; then
    echo "ERROR: SOPS env file not found: $SOPS_FILE" >&2
    exit 1
  fi

  echo "  (reading LBA_MONGODB_URI from SOPS file: env.${ENV_NAME}.yml)"
  LBA_MONGODB_URI="$(sops -d "$SOPS_FILE" | grep -E '^LBA_MONGODB_URI:' | head -1 | sed 's/^LBA_MONGODB_URI:[[:space:]]*//')"
fi

if [[ -z "${LBA_MONGODB_URI:-}" ]]; then
  echo "ERROR: LBA_MONGODB_URI is not set and could not be extracted from SOPS file" >&2
  exit 1
fi

# Retirer directConnection=true de l'URI (incompatible avec createSearchIndex)
MONGO_URI="${LBA_MONGODB_URI//&directConnection=true/}"
MONGO_URI="${MONGO_URI//\?directConnection=true/}"
MONGO_URI="${MONGO_URI//directConnection=true&/}"

echo "Creating MongoDB Search indexes..."

# Détecter mongosh : local, via MONGO_CONTAINER explicite, ou via docker
if command -v mongosh &>/dev/null; then
  MONGOSH="mongosh"
elif [[ -n "${MONGO_CONTAINER:-}" ]]; then
  echo "  (using mongosh from container: $MONGO_CONTAINER)"
  MONGOSH="docker exec $MONGO_CONTAINER mongosh"
else
  CONTAINER=$(docker ps --filter "name=mongodb" --format "{% raw %}{{.Names}}{% endraw %}" | head -1)
  if [[ -z "$CONTAINER" ]]; then
    echo "ERROR: mongosh not found and no running mongodb container detected" >&2
    exit 1
  fi
  echo "  (using mongosh from container: $CONTAINER)"
  MONGOSH="docker exec $CONTAINER mongosh"
fi

$MONGOSH "$MONGO_URI" --quiet --eval '
const searchIndexes = [
  {
    collection: "algolia",
    index: {
      name: "algolia_search",
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            title:             { type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } },
            description:       { type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } },
            keywords:          { type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } },
            organization_name: [{ type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } }, { type: "token" }],
            type:              { type: "token" },
            type_filter_label: { type: "token" },
            sub_type:          { type: "token" },
            contract_type:     { type: "token" },
            level:             { type: "token" },
            activity_sector:   { type: "token" },
            smart_apply:       { type: "boolean" },
            application_count: { type: "number" },
            publication_date:  { type: "date" },
            location:          { type: "geo" },
          }
        },
        synonyms: [
          {
            name: "lba_synonyms",
            analyzer: "lucene.standard",
            source: { collection: "search_synonyms" },
          }
        ]
      }
    }
  }
];

let created = 0;
let updated = 0;

for (const { collection, index } of searchIndexes) {
  const coll = db.getCollection(collection);
  const existing = coll.aggregate([{ $listSearchIndexes: {} }]).toArray();
  const alreadyExists = existing.some(i => i.name === index.name);

  if (alreadyExists) {
    coll.updateSearchIndex(index.name, index.definition);
    print("  [updated] " + collection + "/" + index.name);
    updated++;
  } else {
    coll.createSearchIndex(index);
    print("  [created] " + collection + "/" + index.name);
    created++;
  }
}

print("Done: " + created + " created, " + updated + " updated.");
'
