import { createHash } from "node:crypto"
import { realpathSync } from "node:fs"
import { basename, isAbsolute } from "node:path"
import { fileURLToPath } from "node:url"

// Nom de base de LBA_MONGODB_URI dans server/.env.test, remplacé en entier. Ce fichier ne change pas : son
// contenu entre dans l'empreinte gitleaks du pre-commit (gitleaks-fingerprints-baseline.txt).
export const TEST_DB_URI_PLACEHOLDER = "lba-test-VITEST_POOL_ID"
// Distinct de lba-test- : le teardown des worktrees non rebasés supprime toutes les bases lba-test-*.
export const TEST_DB_PREFIX = "lba-vitest-"
export const TEST_DB_REGISTRY = "lba-vitest-registry"
export const TEST_DB_REGISTRY_COLLECTION = "namespaces"
// Limite du serveur MongoDB, re-vérifiée sur l'instance locale par test-database.test.ts.
export const MAX_DB_NAME_BYTES = 63

const SLUG_MAX_LENGTH = 24
const NAMESPACE_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
const POOL_ID_PATTERN = /^[0-9]+$/
const PLACEHOLDER_SEGMENT = new RegExp(`/${TEST_DB_URI_PLACEHOLDER}(?=\\?|$)`)

// Racine du checkout qui contient ce fichier, quel que soit le répertoire courant.
export const WORKTREE_ROOT = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)))

export type TestDbRegistryEntry = { _id: string; root: string; updatedAt: Date }

const slugify = (folderName: string): string =>
  folderName
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-$/, "")

// `root` doit être un chemin réel : deux chemins vers le même checkout donneraient deux espaces.
export function namespaceFromRoot(root: string): string {
  const hash = createHash("sha1").update(root).digest("hex").slice(0, 8)
  const slug = slugify(basename(root))
  return slug ? `${slug}-${hash}` : hash
}

export function getTestDbNamespace(env: Record<string, string | undefined> = process.env, root: string = WORKTREE_ROOT): string {
  const override = env.LBA_TEST_DB_NAMESPACE
  if (!override) {
    return namespaceFromRoot(root)
  }
  if (!NAMESPACE_PATTERN.test(override)) {
    throw new Error(`LBA_TEST_DB_NAMESPACE invalide : ${JSON.stringify(override)}. Attendu : [a-z0-9-], sans tiret au début ni à la fin.`)
  }
  return override
}

export function getTestDatabaseName(namespace: string, poolId: string | undefined): string {
  if (!NAMESPACE_PATTERN.test(namespace)) {
    throw new Error(`Espace de bases de test invalide : ${JSON.stringify(namespace)}`)
  }
  if (poolId === undefined || !POOL_ID_PATTERN.test(poolId)) {
    throw new Error(`VITEST_POOL_ID doit être un entier, reçu : ${JSON.stringify(poolId)}`)
  }
  const name = `${TEST_DB_PREFIX}${namespace}-${poolId}`
  const bytes = Buffer.byteLength(name)
  if (bytes > MAX_DB_NAME_BYTES) {
    throw new Error(`Nom de base de test trop long : ${name} (${bytes} octets, ${MAX_DB_NAME_BYTES} au plus)`)
  }
  return name
}

export function replaceUriDatabase(uri: string, databaseName: string): string {
  if (!PLACEHOLDER_SEGMENT.test(uri)) {
    throw new Error(`La base de LBA_MONGODB_URI doit être ${TEST_DB_URI_PLACEHOLDER}, remplacée par une base propre au worktree et au worker (cf. server/.env.test).`)
  }
  return uri.replace(PLACEHOLDER_SEGMENT, `/${databaseName}`)
}

export function resolveTestMongoUri(uri: string, poolId: string | undefined, namespace: string = getTestDbNamespace()): string {
  return replaceUriDatabase(uri, getTestDatabaseName(namespace, poolId))
}

function parseTestDatabaseName(name: string): { namespace: string; poolId: string } | null {
  if (!name.startsWith(TEST_DB_PREFIX)) {
    return null
  }
  const rest = name.slice(TEST_DB_PREFIX.length)
  const dash = rest.lastIndexOf("-")
  if (dash <= 0) {
    return null
  }
  const namespace = rest.slice(0, dash)
  const poolId = rest.slice(dash + 1)
  return NAMESPACE_PATTERN.test(namespace) && POOL_ID_PATTERN.test(poolId) ? { namespace, poolId } : null
}

// Bases à supprimer en fin de run : celles de l'espace courant, puis celles des espaces dont la racine n'existe
// plus. Une entrée de registre malformée n'entraîne aucune suppression.
export function planTestDatabaseCleanup({
  databaseNames,
  namespace,
  registry,
  rootExists,
}: {
  databaseNames: readonly string[]
  namespace: string
  registry: readonly { _id?: unknown; root?: unknown }[]
  rootExists: (root: string) => boolean
}): { databases: string[]; staleNamespaces: string[] } {
  const staleNamespaces = registry.flatMap(({ _id, root }) =>
    typeof _id === "string" && _id !== namespace && NAMESPACE_PATTERN.test(_id) && typeof root === "string" && isAbsolute(root) && !rootExists(root) ? [_id] : []
  )
  const targets = new Set([namespace, ...staleNamespaces])
  const databases = databaseNames.filter((name) => {
    const parsed = parseTestDatabaseName(name)
    return parsed !== null && targets.has(parsed.namespace)
  })
  return { databases, staleNamespaces }
}
