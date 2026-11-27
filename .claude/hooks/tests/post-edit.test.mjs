import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, describe, expect, it } from "vitest"

import { cleanup, editPayload, git, makeRepo, runHook, stateFile, tempDir, write } from "./helpers.mjs"

afterAll(cleanup)

const biomeCalls = (repo) => repo.calls().filter((call) => call[0] === "biome")

describe("post-edit : faux positifs (code 0, Biome non appelé)", () => {
  const repo = makeRepo({ files: { "server/src/ignored-local.ts": "debugger\n" } })

  it.each([
    ["un .md", "docs/notes.md"],
    ["un .yml", ".github/workflows/ci.yml"],
    ["un fichier ignoré par git", "server/src/ignored-local.ts"],
  ])("%s", (_, rel) => {
    const result = runHook(repo, "post-edit", editPayload(repo, join(repo.root, rel)))
    expect(result).toMatchObject({ code: 0, stderr: "" })
    expect(biomeCalls(repo)).toEqual([])
  })

  it("un fichier supprimé", () => {
    const result = runHook(repo, "post-edit", editPayload(repo, join(repo.root, "server/src/supprime.ts")))
    expect(result).toMatchObject({ code: 0, stderr: "" })
    expect(biomeCalls(repo)).toEqual([])
  })

  it("un fichier hors dépôt git", () => {
    const outside = join(tempDir(), "hors-depot.ts")
    writeFileSync(outside, "debugger\n")
    expect(runHook(repo, "post-edit", editPayload(repo, outside))).toMatchObject({ code: 0, stderr: "" })
    expect(biomeCalls(repo)).toEqual([])
  })

  it("un fichier d'un autre dépôt git, même avec un biome.json", () => {
    const other = join(tempDir(), "autre")
    mkdirSync(other)
    git(other, "init", "-q")
    write(other, "package.json", JSON.stringify({ name: "autre-projet" }))
    write(other, "biome.json", "{}")
    const file = write(other, "src/x.ts", "debugger\n")
    expect(runHook(repo, "post-edit", editPayload(repo, file))).toMatchObject({ code: 0, stderr: "" })
    expect(biomeCalls(repo)).toEqual([])
  })

  it("un outil autre qu'Edit ou Write, ou sans file_path", () => {
    const file = write(repo.root, "server/src/x.ts", "debugger\n")
    expect(runHook(repo, "post-edit", editPayload(repo, file, { tool_name: "Read" })).code).toBe(0)
    expect(runHook(repo, "post-edit", editPayload(repo, file, { tool_input: {} })).code).toBe(0)
    expect(biomeCalls(repo)).toEqual([])
  })
})

describe("post-edit : lint", () => {
  it("un avertissement seul ne bloque pas", () => {
    const repo = makeRepo()
    const file = write(repo.root, "server/src/warn.ts", "// WARNONLY\n")
    expect(runHook(repo, "post-edit", editPayload(repo, file))).toMatchObject({ code: 0, stderr: "" })
    expect(biomeCalls(repo)).toHaveLength(1)
  })

  it("debugger : code 2, ligne fichier:ligne:col règle sur stderr, sans --write et avec les règles écartées", () => {
    const repo = makeRepo()
    const file = write(repo.root, "server/src/x.ts", "export const x = 1\n  debugger\n")
    const result = runHook(repo, "post-edit", editPayload(repo, file))
    expect(result.code).toBe(2)
    expect(result.stderr).toContain("server/src/x.ts:2:3 lint/suspicious/noDebugger")
    expect(result.stdout).toBe("")
    const [call] = biomeCalls(repo)
    expect(call).toEqual([
      "biome",
      "lint",
      "--reporter=json",
      "--colors=off",
      "--no-errors-on-unmatched",
      "--skip=types",
      "--skip=correctness/noUnusedVariables",
      "server/src/x.ts",
    ])
  })

  it("LBA_HOOKS_EDIT_LINT=full lance toutes les règles, off ne lance rien", () => {
    const repo = makeRepo()
    const file = write(repo.root, "server/src/x.ts", "debugger\n")
    expect(runHook(repo, "post-edit", editPayload(repo, file), { env: { LBA_HOOKS_EDIT_LINT: "full" } }).code).toBe(2)
    expect(biomeCalls(repo)[0]).not.toContain("--skip=types")
    expect(runHook(repo, "post-edit", editPayload(repo, file), { env: { LBA_HOOKS_EDIT_LINT: "off" } }).code).toBe(0)
    expect(biomeCalls(repo)).toHaveLength(1)
  })

  it("chemin avec espace, guillemet et $(…) : passé tel quel, sans shell", () => {
    const repo = makeRepo()
    const rel = 'server/src/a b "c" $(touch pwned).ts'
    const file = write(repo.root, rel, "debugger\n")
    const result = runHook(repo, "post-edit", editPayload(repo, file))
    expect(result.code).toBe(2)
    expect(biomeCalls(repo)[0].at(-1)).toBe(rel)
    expect(existsSync(join(repo.root, "pwned"))).toBe(false)
    expect(existsSync(join(repo.dir, "pwned"))).toBe(false)
  })

  it("même tool_use_id deux fois : le second sort en 0 sans relancer Biome", () => {
    const repo = makeRepo()
    const file = write(repo.root, "server/src/x.ts", "debugger\n")
    const input = editPayload(repo, file)
    expect(runHook(repo, "post-edit", input).code).toBe(2)
    expect(runHook(repo, "post-edit", input).code).toBe(0)
    expect(biomeCalls(repo)).toHaveLength(1)
  })

  it("fichier d'un autre worktree LBA que le cwd : lint avec la racine de ce worktree", () => {
    const repo = makeRepo()
    const other = makeRepo()
    const file = write(other.root, "ui/x.tsx", "debugger\n")
    const result = runHook(repo, "post-edit", editPayload(repo, file), { env: { FAKE_LOG: other.fakeLog } })
    expect(result.code).toBe(2)
    expect(result.stderr).toContain("ui/x.tsx:1:1")
    expect(other.calls().filter((call) => call[0] === "biome")).toHaveLength(1)
  })
})

describe("post-edit : dégradations et erreurs", () => {
  it("Biome absent : code 1 la première fois de la session, puis 0 ; jamais 2", () => {
    const repo = makeRepo({ tools: false })
    const file = write(repo.root, "server/src/x.ts", "debugger\n")
    const first = runHook(repo, "post-edit", editPayload(repo, file))
    expect(first.code).toBe(1)
    expect(first.stderr).toContain("Biome introuvable")
    expect(first.stdout).toBe("")
    expect(runHook(repo, "post-edit", editPayload(repo, file)).code).toBe(0)
  })

  it("sans scripts dans le worktree ni Biome : avis de repli émis une seule fois, avec le code 1", () => {
    const host = makeRepo()
    const bare = makeRepo({ scripts: false, tools: false })
    const file = write(bare.root, "server/src/x.ts", "debugger\n")
    const first = runHook(bare, "post-edit", editPayload(bare, file), { scriptsRoot: host.root })
    expect(first.code).toBe(1)
    expect(first.stderr).toContain("Biome introuvable")
    expect(first.stderr).toContain("Scripts de vérification absents de ce worktree")
    const second = runHook(bare, "post-edit", editPayload(bare, file), { scriptsRoot: host.root })
    expect(second).toMatchObject({ code: 0, stdout: "", stderr: "" })
  })

  it("Biome absent en mode strict : code 2", () => {
    const repo = makeRepo({ tools: false })
    const file = write(repo.root, "server/src/x.ts", "debugger\n")
    expect(runHook(repo, "post-edit", editPayload(repo, file), { env: { LBA_HOOKS_STRICT: "1" } }).code).toBe(2)
  })

  it("Biome qui plante : code 1", () => {
    const repo = makeRepo()
    const file = write(repo.root, "server/src/x.ts", "debugger\n")
    const result = runHook(repo, "post-edit", editPayload(repo, file), { env: { FAKE_BIOME: "crash" } })
    expect(result.code).toBe(1)
    expect(result.stderr).toContain("rapport Biome illisible")
  })

  it("stdin illisible : code 1", () => {
    const repo = makeRepo()
    expect(runHook(repo, "post-edit", "pas du json")).toMatchObject({ code: 1, stdout: "" })
  })

  it("erreur interne injectée (état non inscriptible) : code 1, jamais 2", () => {
    const repo = makeRepo()
    const file = write(repo.root, "server/src/x.ts", "debugger\n")
    writeFileSync(stateFile(repo, ""), "un fichier à la place du dossier d'état")
    const result = runHook(repo, "post-edit", editPayload(repo, file))
    expect(result.code).toBe(1)
    expect(result.stderr).toContain("erreur interne")
    expect(result.stdout).toBe("")
  })

  it("LBA_HOOKS=off : code 0 sans rien lancer", () => {
    const repo = makeRepo()
    const file = write(repo.root, "server/src/x.ts", "debugger\n")
    expect(runHook(repo, "post-edit", editPayload(repo, file), { env: { LBA_HOOKS: "off" } })).toMatchObject({ code: 0, stderr: "" })
    expect(biomeCalls(repo)).toEqual([])
  })
})
