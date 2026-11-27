import { existsSync, realpathSync } from "node:fs"
import { join } from "node:path"
import { MongoClient } from "mongodb"
import { describe, expect, it } from "vitest"

import config from "@/config"
import {
  getTestDatabaseName,
  getTestDbNamespace,
  MAX_DB_NAME_BYTES,
  namespaceFromRoot,
  planTestDatabaseCleanup,
  resolveTestMongoUri,
  TEST_DB_PREFIX,
  TEST_DB_REGISTRY,
  TEST_DB_URI_PLACEHOLDER,
  WORKTREE_ROOT,
} from "./test-database"

// Hash attendus calculés hors de Node : printf '%s' /a/wt | shasum -a 1
const NAMESPACE_A = "wt-b64f176f"

// Prédicat du teardown des worktrees qui n'ont pas cette version de globalSetup.ts.
const removedByLegacyTeardown = (name: string) => name.startsWith("lba-test-")

describe("namespaceFromRoot", () => {
  it("donne deux espaces à deux dossiers de même nom", () => {
    expect(namespaceFromRoot("/a/wt")).toBe(NAMESPACE_A)
    expect(namespaceFromRoot("/b/wt")).toBe("wt-6a3b26f0")
  })

  it("réduit le nom du dossier à [a-z0-9-]", () => {
    expect(namespaceFromRoot("/a/Été 2026 (copie)_#1")).toMatch(/^ete-2026-copie-1-[0-9a-f]{8}$/)
    expect(namespaceFromRoot("/a/--LBA..worktree--")).toMatch(/^lba-worktree-[0-9a-f]{8}$/)
  })

  it("tronque le nom du dossier à 24 caractères, sans tiret final", () => {
    expect(namespaceFromRoot(`/a/${"x".repeat(40)}`)).toMatch(/^x{24}-[0-9a-f]{8}$/)
    expect(namespaceFromRoot("/a/abcdefghijklmnopqrstuvw-xyz")).toMatch(/^abcdefghijklmnopqrstuvw-[0-9a-f]{8}$/)
  })

  it("se réduit au hash quand aucun caractère du dossier n'est retenu", () => {
    expect(namespaceFromRoot("/a/___")).toMatch(/^[0-9a-f]{8}$/)
    expect(namespaceFromRoot("/a/日本")).toMatch(/^[0-9a-f]{8}$/)
  })
})

describe("getTestDbNamespace", () => {
  it("refuse une surcharge hors [a-z0-9-]", () => {
    for (const value of ["Feature", "feature_x", "feature.x", "-feature", "feature-", " feature", "feature/x", "é"]) {
      expect(() => getTestDbNamespace({ LBA_TEST_DB_NAMESPACE: value }, "/a/wt"), value).toThrow("LBA_TEST_DB_NAMESPACE invalide")
    }
  })

  it("garde une surcharge valide telle quelle", () => {
    expect(getTestDbNamespace({ LBA_TEST_DB_NAMESPACE: "feature-42" }, "/a/wt")).toBe("feature-42")
  })

  it("ignore une surcharge vide", () => {
    expect(getTestDbNamespace({ LBA_TEST_DB_NAMESPACE: "" }, "/a/wt")).toBe(NAMESPACE_A)
  })

  it("part du chemin réel du checkout qui contient le module", () => {
    expect(existsSync(join(WORKTREE_ROOT, "server/tests/utils/test-database.ts"))).toBe(true)
    expect(realpathSync(WORKTREE_ROOT)).toBe(WORKTREE_ROOT)
    expect(getTestDbNamespace({})).toBe(namespaceFromRoot(WORKTREE_ROOT))
  })
})

describe("getTestDatabaseName", () => {
  it("refuse un VITEST_POOL_ID non numérique", () => {
    for (const poolId of [undefined, "", "abc", "1a", "-1", "1.5", " 1", "1 ", "VITEST_POOL_ID"]) {
      expect(() => getTestDatabaseName(NAMESPACE_A, poolId), String(poolId)).toThrow("VITEST_POOL_ID doit être un entier")
    }
  })

  it("accepte un nom de 63 octets et refuse 64", () => {
    // lba-vitest- (11 octets) + espace + -1 (2 octets)
    expect(Buffer.byteLength(getTestDatabaseName("a".repeat(50), "1"))).toBe(63)
    expect(() => getTestDatabaseName("a".repeat(51), "1")).toThrow("(64 octets, 63 au plus)")
  })

  it("ne produit aucun nom que le teardown des worktrees non rebasés supprimerait", () => {
    for (const namespace of [getTestDbNamespace(), NAMESPACE_A, "test-1", "a"]) {
      expect(removedByLegacyTeardown(getTestDatabaseName(namespace, "1"))).toBe(false)
    }
    expect(removedByLegacyTeardown(TEST_DB_REGISTRY)).toBe(false)
  })
})

describe("resolveTestMongoUri", () => {
  const uri = config.mongodb.uri

  it("lève une erreur quand la base de l'URI n'est pas exactement le nom attendu", () => {
    const nearMisses = {
      "base déjà résolue": uri.replace(TEST_DB_URI_PLACEHOLDER, "lba-test-1"),
      "autre préfixe devant VITEST_POOL_ID": uri.replace(TEST_DB_URI_PLACEHOLDER, "labonnealternance-VITEST_POOL_ID"),
      "nom prolongé": uri.replace(TEST_DB_URI_PLACEHOLDER, `${TEST_DB_URI_PLACEHOLDER}-x`),
      "sans base": uri.replace(`/${TEST_DB_URI_PLACEHOLDER}`, "/"),
      "nom hors du chemin": `${uri.replace(TEST_DB_URI_PLACEHOLDER, "lba")}&appName=${TEST_DB_URI_PLACEHOLDER}`,
    }
    for (const [label, candidate] of Object.entries(nearMisses)) {
      expect(candidate, label).not.toBe(uri)
      expect(() => resolveTestMongoUri(candidate, "1", NAMESPACE_A), label).toThrow(`La base de LBA_MONGODB_URI doit être ${TEST_DB_URI_PLACEHOLDER}`)
    }
  })

  it("remplace le nom entier par la base de l'espace et du worker", () => {
    const resolved = resolveTestMongoUri(uri, "3", NAMESPACE_A)
    expect(resolved).toContain(`/${TEST_DB_PREFIX}${NAMESPACE_A}-3?`)
    expect(resolved).not.toContain("VITEST_POOL_ID")
    expect(resolved.replace(`/${TEST_DB_PREFIX}${NAMESPACE_A}-3?`, `/${TEST_DB_URI_PLACEHOLDER}?`)).toBe(uri)
  })
})

describe("planTestDatabaseCleanup", () => {
  const plan = (databaseNames: string[], registry: { _id?: unknown; root?: unknown }[] = [], existingRoots: string[] = []) =>
    planTestDatabaseCleanup({ databaseNames, namespace: NAMESPACE_A, registry, rootExists: (root) => existingRoots.includes(root) })

  it("ne retient que les bases lba-vitest-<espace>-<entier> de l'espace courant", () => {
    const nearMisses = [
      `lba-vitest-${NAMESPACE_A}-bar-1`, // espace surchargé dont l'espace courant est un préfixe
      `lba-vitest-${NAMESPACE_A}-1-2`, // pool 2 de l'espace « <espace courant>-1 »
      `lba-vitest-${NAMESPACE_A}x-1`,
      `lba-vitest-${NAMESPACE_A}`,
      `lba-vitest-${NAMESPACE_A}-`,
      `lba-vitest-${NAMESPACE_A}-x`,
      "lba-vitest-registry",
      "lba-test-1",
      `lba-test-${NAMESPACE_A}-1`,
      `xlba-vitest-${NAMESPACE_A}-1`,
      `LBA-VITEST-${NAMESPACE_A.toUpperCase()}-1`,
    ]
    expect(plan([`lba-vitest-${NAMESPACE_A}-1`, ...nearMisses, `lba-vitest-${NAMESPACE_A}-12`])).toEqual({
      databases: [`lba-vitest-${NAMESPACE_A}-1`, `lba-vitest-${NAMESPACE_A}-12`],
      staleNamespaces: [],
    })
  })

  it("ne supprime rien sur la foi d'une entrée de registre malformée", () => {
    const registry = [
      { _id: "relatif-0000aaaa", root: "wt" },
      { _id: "sans-racine-0000aaaa" },
      { _id: 42, root: "/disparu" },
      { _id: "Invalide_0000aaaa", root: "/disparu" },
      { _id: "", root: "/disparu" },
      { root: "/disparu" },
    ]
    expect(plan(["lba-vitest-relatif-0000aaaa-1", "lba-vitest-sans-racine-0000aaaa-1", "lba-vitest-42-1"], registry)).toEqual({ databases: [], staleNamespaces: [] })
  })

  it("ne déclare jamais l'espace courant périmé", () => {
    expect(plan([`lba-vitest-${NAMESPACE_A}-1`], [{ _id: NAMESPACE_A, root: "/disparu" }])).toEqual({
      databases: [`lba-vitest-${NAMESPACE_A}-1`],
      staleNamespaces: [],
    })
  })

  it("ajoute les bases des espaces dont la racine n'existe plus, et seulement celles-là", () => {
    const registry = [
      { _id: "disparu-0000aaaa", root: "/a/disparu" },
      { _id: "present-0000bbbb", root: "/a/present" },
    ]
    const databases = [
      "lba-vitest-disparu-0000aaaa-1",
      "lba-vitest-disparu-0000aaaa-7",
      "lba-vitest-disparu-0000aaaa-bar-1",
      "lba-vitest-present-0000bbbb-1",
      `lba-vitest-${NAMESPACE_A}-2`,
    ]
    expect(plan(databases, registry, ["/a/present"])).toEqual({
      databases: ["lba-vitest-disparu-0000aaaa-1", "lba-vitest-disparu-0000aaaa-7", `lba-vitest-${NAMESPACE_A}-2`],
      staleNamespaces: ["disparu-0000aaaa"],
    })
  })
})

describe("MAX_DB_NAME_BYTES", () => {
  // Sans MongoDB joignable, ce test échoue au lieu d'être ignoré.
  it("correspond à la limite du serveur MongoDB : 63 octets acceptés, 64 refusés", async () => {
    const namespace = getTestDbNamespace()
    const padding = MAX_DB_NAME_BYTES - Buffer.byteLength(`${TEST_DB_PREFIX}${namespace}-`)
    // Dans l'espace du worktree : si le test s'interrompt, le teardown supprime la base.
    const atLimit = getTestDatabaseName(namespace, "9".repeat(padding))
    const overLimit = `${atLimit}9`
    expect(() => getTestDatabaseName(namespace, "9".repeat(padding + 1))).toThrow("octets")

    const client = new MongoClient(resolveTestMongoUri(config.mongodb.uri, process.env.VITEST_POOL_ID), { serverSelectionTimeoutMS: 2_000 })
    try {
      await client.connect()
      await client.db(atLimit).createCollection("probe")
      await client.db(atLimit).dropDatabase()
      await expect(client.db(overLimit).createCollection("probe")).rejects.toMatchObject({ codeName: "InvalidNamespace" })
    } finally {
      await client.close()
    }
  })
})
