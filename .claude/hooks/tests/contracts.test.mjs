import { execFileSync, spawnSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { deserialize } from "node:v8"
import { gunzipSync } from "node:zlib"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { biomeFileCount, depsState, lockfileChecksum, parseBiomeReport } from "../lib/tools.mjs"
import { cleanup, git, REPO_ROOT, tempDir, write } from "./helpers.mjs"

afterAll(cleanup)

const EDIT_SKIPS = ["--skip=types", "--skip=correctness/noUnusedVariables"]

describe("contrat : vrai Biome du dépôt", () => {
  const biome = join(REPO_ROOT, "node_modules", ".bin", "biome")
  let root

  beforeAll(() => {
    expect(existsSync(biome), `${biome} absent : yarn install`).toBe(true)
    root = join(tempDir(), "biome")
    mkdirSync(root)
    git(root, "init", "-q")
    cpSync(join(REPO_ROOT, "biome.json"), join(root, "biome.json"))
    cpSync(join(REPO_ROOT, ".biome"), join(root, ".biome"), { recursive: true })
  })

  const lint = (rel, skips = EDIT_SKIPS) => {
    const run = spawnSync(biome, ["lint", "--reporter=json", "--colors=off", "--no-errors-on-unmatched", ...skips, rel], { cwd: root, encoding: "utf8" })
    return { code: run.status, report: parseBiomeReport(run.stdout) }
  }

  it("rapport JSON : summary.errors, diagnostic avec catégorie, chemin relatif, ligne et colonne", () => {
    write(root, "src/debugger.ts", "export const x = 1\n  debugger\n")
    const { code, report } = lint("src/debugger.ts")
    expect(code).not.toBe(0)
    expect(report.summary.errors).toBe(1)
    expect(biomeFileCount(report.summary)).toBe(1)
    expect(report.diagnostics[0]).toMatchObject({ severity: "error", category: "lint/suspicious/noDebugger", location: { path: "src/debugger.ts", start: { line: 2, column: 3 } } })
  })

  it("fichier absent : code 0 et aucune erreur comptée (le script filtre lui-même)", () => {
    const { code, report } = lint("src/absent.ts")
    expect(code).toBe(0)
    expect(report.summary.errors).toBe(0)
    expect(biomeFileCount(report.summary)).toBe(0)
  })

  it(".md : code 0, aucun fichier traité", () => {
    write(root, "notes.md", "# notes\n")
    const { code, report } = lint("notes.md")
    expect(code).toBe(0)
    expect(biomeFileCount(report.summary)).toBe(0)
  })

  it("règles écartées à l'édition : en error dans biome.json, rattrapées sans --skip", () => {
    const config = JSON.parse(readFileSync(join(REPO_ROOT, "biome.json"), "utf8"))
    expect(config.linter.rules.correctness.noUnusedVariables).toBe("error")
    expect(config.linter.rules.nursery.noFloatingPromises).toBe("error")
    expect(config.linter.rules.nursery.useExhaustiveSwitchCases).toBe("error")

    write(root, "src/unused.ts", "export function f() {\n  const unused = 1\n  return 2\n}\n")
    write(root, "src/floating.ts", "async function g() {\n  return 1\n}\nexport function h() {\n  g()\n}\n")
    for (const rel of ["src/unused.ts", "src/floating.ts"]) {
      expect(lint(rel).report.summary.errors, `${rel} avec --skip`).toBe(0)
      expect(lint(rel, []).report.summary.errors, `${rel} sans --skip`).toBeGreaterThan(0)
    }
  })
})

describe("contrat : état d'installation Yarn", () => {
  it('lockFileChecksum de .yarn/install-state.gz = sha512("1" + yarn.lock)', () => {
    const statePath = join(REPO_ROOT, ".yarn", "install-state.gz")
    expect(existsSync(statePath), `${statePath} absent : yarn install`).toBe(true)
    const state = deserialize(gunzipSync(readFileSync(statePath)))
    expect(state.lockFileChecksum).toBe(lockfileChecksum(readFileSync(join(REPO_ROOT, "yarn.lock"), "utf8")))
    expect(depsState(REPO_ROOT)).toEqual({ status: "fresh" })
  })
})

describe("contrat : lanceur", () => {
  it("run.sh est exécutable dans l'index git (usage direct en ligne de commande)", () => {
    const entry = execFileSync("git", ["ls-files", "-s", "--", ".claude/hooks/run.sh"], { cwd: REPO_ROOT, encoding: "utf8" })
    expect(entry, "run.sh absent de l'index").not.toBe("")
    expect(entry.split(" ")[0]).toBe("100755")
  })
})
