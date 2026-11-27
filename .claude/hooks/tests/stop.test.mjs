import { chmodSync, existsSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { createServer } from "node:net"
import { join } from "node:path"
import { afterAll, describe, expect, it } from "vitest"

import { cleanup, git, lastRun, linkMongoDriver, makeRepo, runHook, runHookAsync, stateFile, stopPayload, write, writeInstallState } from "./helpers.mjs"

afterAll(cleanup)

const toolCalls = (repo, name) => repo.calls().filter((call) => !name || call[0] === name)

function closedPort() {
  return new Promise((done) => {
    const server = createServer()
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address()
      server.close(() => done(port))
    })
  })
}

describe("stop : sessions sans code (code 0 en moins d'une seconde, aucun outil)", () => {
  it("arbre égal au point de départ de la branche", () => {
    const repo = makeRepo()
    const result = runHook(repo, "stop", stopPayload(repo))
    expect(result).toMatchObject({ code: 0, stderr: "" })
    expect(toolCalls(repo)).toEqual([])
  })

  it("modification puis retour au contenu d'origine", () => {
    const repo = makeRepo()
    write(repo.root, "server/src/a.ts", "export const a = 2\n")
    write(repo.root, "server/src/a.ts", "export const a = 1\n")
    expect(runHook(repo, "stop", stopPayload(repo))).toMatchObject({ code: 0, stderr: "" })
    expect(toolCalls(repo)).toEqual([])
  })

  it("seuls docs/ et .github/ modifiés", () => {
    const repo = makeRepo()
    write(repo.root, "docs/notes.md", "# autre\n")
    write(repo.root, ".github/workflows/ci.yml", "name: autre\n")
    write(repo.root, "docs/nouveau.md", "x\n")
    expect(runHook(repo, "stop", stopPayload(repo))).toMatchObject({ code: 0, stderr: "" })
    expect(toolCalls(repo)).toEqual([])
    expect(lastRun(repo).verdict).toBe("skipped")
  })

  it("fichier ignoré par git modifié", () => {
    const repo = makeRepo()
    write(repo.root, "server/src/ignored-x.ts", "debugger\n")
    write(repo.root, "server/.env.test.local", "LBA_X=1\n")
    expect(runHook(repo, "stop", stopPayload(repo))).toMatchObject({ code: 0, stderr: "" })
    expect(toolCalls(repo)).toEqual([])
  })

  it("arbre égal à la base posée par session-start, même si la branche diffère de main", () => {
    const repo = makeRepo()
    write(repo.root, "ui/c.tsx", "debugger\n")
    git(repo.root, "commit", "-qam", "rouge antérieur à la session")
    expect(runHook(repo, "session-start", { session_id: "s2", cwd: repo.root, source: "startup" }).code).toBe(0)
    expect(runHook(repo, "stop", stopPayload(repo, { session_id: "s2" }))).toMatchObject({ code: 0, stderr: "" })
    expect(toolCalls(repo)).toEqual([])
  })

  it("SubagentStop sur l'arbre de la session parente", () => {
    const repo = makeRepo()
    expect(runHook(repo, "session-start", { session_id: "s1", cwd: repo.root, source: "startup" }).code).toBe(0)
    write(repo.root, "ui/c.tsx", "debugger\n")
    const result = runHook(repo, "stop", stopPayload(repo, { hook_event_name: "SubagentStop", agent_id: "a1", agent_type: "Explore" }))
    expect(result).toMatchObject({ code: 0, stderr: "" })
    expect(toolCalls(repo)).toEqual([])
  })

  it("SubagentStop sans base de session, worktree qui n'est pas celui de l'agent", () => {
    const repo = makeRepo()
    write(repo.root, "ui/c.tsx", "debugger\n")
    expect(runHook(repo, "stop", stopPayload(repo, { hook_event_name: "SubagentStop", agent_id: "a1" })).code).toBe(0)
    expect(toolCalls(repo)).toEqual([])
  })
})

describe("stop : traduction en invocation des outils", () => {
  it("modification de même taille dans la seconde du dernier commit : détectée plus tard (racy git)", async () => {
    const repo = makeRepo()
    write(repo.root, "ui/c.tsx", "export const c = 7\n")
    await new Promise((done) => setTimeout(done, 1_100))
    runHook(repo, "stop", stopPayload(repo))
    expect(toolCalls(repo, "vitest")).toHaveLength(1)
    expect(lastRun(repo).files).toEqual(["ui/c.tsx"])
  })

  it("package.json modifié : jamais passé à vitest related, dégradé global-change", () => {
    const repo = makeRepo()
    write(repo.root, "package.json", JSON.stringify({ name: "mna-lba", private: true, version: "1.0.0" }))
    write(repo.root, "ui/c.tsx", "export const c = 2\n")
    const result = runHook(repo, "stop", stopPayload(repo))
    const [vitest] = toolCalls(repo, "vitest")
    expect(vitest).toBeDefined()
    expect(vitest.filter((arg) => arg.endsWith("package.json"))).toEqual([])
    expect(result.code).toBe(2)
    expect(result.stderr).toContain("global-change")
  })

  it("fichier supprimé : ni format ni tests sur lui, typecheck lancé", () => {
    const repo = makeRepo()
    rmSync(join(repo.root, "server/src/a.ts"))
    runHook(repo, "stop", stopPayload(repo))
    const calls = toolCalls(repo)
    expect(calls.filter((call) => call.includes("server/src/a.ts"))).toEqual([])
    expect(toolCalls(repo, "tsc")).toHaveLength(1)
    expect(toolCalls(repo, "vitest")).toEqual([])
  })

  it("zéro test lié : « aucun fichier lié », jamais « vert » sur les tests", () => {
    const repo = makeRepo()
    write(repo.root, "ui/sans-test.tsx", "export const s = 1\n")
    const result = runHook(repo, "stop", stopPayload(repo))
    expect(result.code).toBe(0)
    const message = JSON.parse(result.stdout).systemMessage
    expect(message).toContain("tests : aucun fichier lié")
    expect(message).not.toMatch(/tests? verts?/)
    expect(lastRun(repo).coverage.tests).toEqual({ files: 0, projects: ["ui"] })
  })

  it("vert : séquence format, lint, typecheck puis tests liés, couverture pour l'utilisateur", () => {
    const repo = makeRepo()
    write(repo.root, "ui/c.tsx", "export const c = 2\n")
    const result = runHook(repo, "stop", stopPayload(repo))
    expect(result.code).toBe(0)
    expect(JSON.parse(result.stdout).systemMessage).toMatch(/^\[lba-hooks\] Vert : lint \d+ fichiers?, typecheck 3 projets, tests 1 fichier sur ui, Node v/)
    expect(toolCalls(repo).map((call) => `${call[0]} ${call[1]}`)).toEqual(["biome check", "biome ci", "tsc -b", "vitest related"])
    expect(toolCalls(repo, "vitest")[0]).toEqual(expect.arrayContaining(["ui/c.tsx", "--project", "ui", "--maxWorkers=3"]))
    expect(lastRun(repo).verdict).toBe("green")
    expect(runHook(repo, "stop", stopPayload(repo))).toMatchObject({ code: 0, stderr: "" })
    expect(toolCalls(repo)).toHaveLength(4)
  })

  it("plus de 60 fichiers : seuls les tests modifiés, dégradé too-broad", () => {
    const repo = makeRepo()
    for (let i = 0; i < 61; i++) write(repo.root, `ui/f${i}.tsx`, `export const f${i} = ${i}\n`)
    write(repo.root, "ui/c.test.tsx", "import { c } from './c'\n// modifié\n")
    const result = runHook(repo, "stop", stopPayload(repo))
    const [vitest] = toolCalls(repo, "vitest")
    expect(vitest.filter((arg) => arg.startsWith("ui/"))).toEqual(["ui/c.test.tsx"])
    expect(result.code).toBe(2)
    expect(result.stderr).toContain("too-broad")
  })

  it("code commité non formaté réécrit par --write : rouge", () => {
    const repo = makeRepo()
    git(repo.root, "checkout", "-qb", "branche")
    write(repo.root, "ui/c.tsx", "export const c = 1 /*unformatted*/\n")
    git(repo.root, "commit", "-qam", "commit non formaté")
    const result = runHook(repo, "stop", stopPayload(repo))
    expect(result.code).toBe(2)
    expect(result.stderr).toContain("code commité non formaté, corrigé par biome check --write dans ui/c.tsx")
    expect(readFileSync(join(repo.root, "ui/c.tsx"), "utf8")).toBe("export const c = 1 \n")
    expect(runHook(repo, "stop", stopPayload(repo, { stop_hook_active: true })).code).toBe(1)
    expect(toolCalls(repo, "biome").filter((call) => call[1] === "ci")).toHaveLength(1)
  })

  it("fichier non commité réécrit par --write : pas rouge, arbre reformaté retenu comme vert", () => {
    const repo = makeRepo()
    write(repo.root, "ui/c.tsx", "export const c = 1 /*unformatted*/\n")
    expect(runHook(repo, "stop", stopPayload(repo)).code).toBe(0)
    expect(readFileSync(join(repo.root, "ui/c.tsx"), "utf8")).toBe("export const c = 1 \n")
    const calls = toolCalls(repo).length
    expect(runHook(repo, "stop", stopPayload(repo))).toMatchObject({ code: 0, stderr: "" })
    expect(toolCalls(repo)).toHaveLength(calls)
  })
})

describe("stop : verdicts et anti-boucle", () => {
  it("5 rouges, arbre modifié à chaque fois, stop_hook_active à true : 2 2 2 1 1", () => {
    const repo = makeRepo()
    const codes = []
    for (let i = 0; i < 5; i++) {
      write(repo.root, "ui/c.tsx", `export const c = ${i + 10}\n`)
      codes.push(runHook(repo, "stop", stopPayload(repo, { stop_hook_active: i > 0 }), { env: { FAKE_VITEST: "red" } }).code)
    }
    expect(codes).toEqual([2, 2, 2, 1, 1])
    expect(lastRun(repo).verdict).toBe("released")
    expect(toolCalls(repo, "vitest")).toHaveLength(5)
  })

  it("arbre inchangé depuis le blocage : 2 puis 1, sans relancer les outils", () => {
    const repo = makeRepo()
    write(repo.root, "ui/c.tsx", "export const c = 3\n")
    const first = runHook(repo, "stop", stopPayload(repo), { env: { FAKE_VITEST: "red" } })
    const second = runHook(repo, "stop", stopPayload(repo, { stop_hook_active: true }), { env: { FAKE_VITEST: "red" } })
    expect([first.code, second.code]).toEqual([2, 1])
    expect(first.stderr).toContain("ui/c.test.tsx > fake > it : AssertionError")
    expect(second.stderr).toContain("garde relâchée")
    expect(second.stdout).toBe("")
    expect(toolCalls(repo, "vitest")).toHaveLength(1)
    expect(lastRun(repo).verdict).toBe("released")
  })

  it("lint rouge : tests non lancés, rouge rapporté avec fichier:ligne", () => {
    const repo = makeRepo()
    write(repo.root, "ui/c.tsx", "export const c = 1\ndebugger\n")
    const result = runHook(repo, "stop", stopPayload(repo))
    expect(result.code).toBe(2)
    expect(result.stderr).toContain("ui/c.tsx:2:1 lint/suspicious/noDebugger")
    expect(toolCalls(repo, "vitest")).toEqual([])
  })

  it("typecheck rouge : erreurs tsc rapportées", () => {
    const repo = makeRepo()
    write(repo.root, "shared/src/b.ts", "export const b: number = 'TYPE_ERROR'\n")
    const result = runHook(repo, "stop", stopPayload(repo))
    expect(result.code).toBe(2)
    expect(result.stderr).toContain("shared/src/b.ts(1,1): error TS2322")
    expect(toolCalls(repo, "tsc")[0]).toEqual(["tsc", "-b", "ui/tsconfig.json", "server/tsconfig.json", "shared/tsconfig.json", "--pretty", "false"])
  })

  it("double départ de la même session : outils lancés une fois, un seul verdict", async () => {
    const repo = makeRepo()
    write(repo.root, "ui/c.tsx", "export const c = 4\n")
    const env = { FAKE_VITEST: "red", FAKE_VITEST_SLEEP_MS: "1500" }
    const results = await Promise.all([runHookAsync(repo, "stop", stopPayload(repo), { env }), runHookAsync(repo, "stop", stopPayload(repo), { env })])
    expect(results.map((result) => result.code).sort()).toEqual([0, 2])
    expect(toolCalls(repo, "vitest")).toHaveLength(1)
    expect(JSON.parse(readFileSync(stateFile(repo, "sessions/s1/blocks.json"), "utf8"))).toHaveLength(1)
    expect(lastRun(repo).verdict).toBe("red")
  })
})

describe("stop : infrastructure absente et dégradations", () => {
  async function mongoRepo({ isolation = true } = {}) {
    const port = await closedPort()
    const files = { "server/.env.test": `LBA_MONGODB_URI=mongodb://127.0.0.1:${port}/lba-test-VITEST_POOL_ID?directConnection=true\n` }
    if (isolation) files["server/tests/utils/test-database.ts"] = "export {}\n"
    const repo = makeRepo({ files })
    linkMongoDriver(repo.root)
    return { repo, port }
  }

  it("Mongo fermé : 2 (information) puis 0 0 0, status --strict en 3", async () => {
    const { repo, port } = await mongoRepo()
    write(repo.root, "server/src/a.ts", "export const a = 5\n")
    const env = { LBA_HOOKS_MONGO_TIMEOUT_MS: "300" }
    const codes = []
    const results = []
    for (let i = 0; i < 4; i++) {
      const result = runHook(repo, "stop", stopPayload(repo, { stop_hook_active: i > 0 }), { env })
      codes.push(result.code)
      results.push(result)
    }
    expect(codes).toEqual([2, 0, 0, 0])
    expect(results[0].stderr).toContain("INFORMATION")
    expect(results[0].stderr).toContain(`mongo-unreachable : MongoDB injoignable (127.0.0.1:${port}`)
    expect(JSON.parse(results[1].stdout).systemMessage).toContain("mongo-unreachable")
    expect(lastRun(repo).causes.map((cause) => cause.id)).toEqual(["mongo-unreachable"])
    expect(toolCalls(repo, "vitest")).toEqual([])
    expect(runHook(repo, "status", undefined, { args: ["--cwd", repo.root, "--strict"] }).code).toBe(3)
    expect(runHook(repo, "status", undefined, { args: ["--cwd", repo.root] }).code).toBe(0)
  })

  it("arbre sans isolation des bases : projets server exclus, causes signalées ensemble", async () => {
    const { repo } = await mongoRepo({ isolation: false })
    write(repo.root, "server/src/a.ts", "export const a = 6\n")
    write(repo.root, "ui/c.tsx", "export const c = 6\n")
    const result = runHook(repo, "stop", stopPayload(repo), { env: { LBA_HOOKS_MONGO_TIMEOUT_MS: "300" } })
    expect(result.code).toBe(2)
    expect(result.stderr).toContain("no-db-isolation")
    expect(result.stderr).toContain("mongo-unreachable")
    const [vitest] = toolCalls(repo, "vitest")
    expect(vitest).toEqual(expect.arrayContaining(["--project", "ui"]))
    expect(vitest).not.toContain("server")
    expect(vitest).not.toContain("server-isolated")
  })

  it("node_modules périmé (yarn.lock modifié depuis l'installation) : aucun outil, message yarn install", () => {
    const repo = makeRepo()
    write(repo.root, "yarn.lock", "# lock modifié\n")
    write(repo.root, "ui/c.tsx", "export const c = 7\n")
    const result = runHook(repo, "stop", stopPayload(repo))
    expect(result.code).toBe(2)
    expect(result.stderr).toContain("deps-stale")
    expect(result.stderr).toContain("yarn install")
    expect(toolCalls(repo)).toEqual([])
    writeInstallState(repo.root)
    expect(runHook(repo, "stop", stopPayload(repo, { stop_hook_active: true })).code).toBe(2)
    expect(toolCalls(repo, "vitest")).toHaveLength(1)
  })

  it("yarn.lock plus récent que l'installation mais inchangé : pas périmé", () => {
    const repo = makeRepo()
    const future = new Date(Date.now() + 60_000)
    utimesSync(join(repo.root, "yarn.lock"), future, future)
    write(repo.root, "ui/c.tsx", "export const c = 8\n")
    const result = runHook(repo, "stop", stopPayload(repo))
    expect(result.code).toBe(0)
    expect(toolCalls(repo, "vitest")).toHaveLength(1)
  })

  it("Node différent de .node-version : vérifié quand même, signalé", () => {
    const repo = makeRepo({ files: { ".node-version": "v1.0.0\n" } })
    write(repo.root, "ui/c.tsx", "export const c = 9\n")
    const result = runHook(repo, "stop", stopPayload(repo))
    expect(result.code).toBe(2)
    expect(result.stderr).toContain("node-mismatch")
    expect(result.stderr).toContain(`Node ${process.version} au lieu de v1.0.0`)
    expect(toolCalls(repo, "vitest")).toHaveLength(1)
  })

  it("dépôt sans merge-base ni base : no-baseline, vérifie par rapport à HEAD", () => {
    const repo = makeRepo()
    git(repo.root, "checkout", "-q", "--orphan", "orpheline")
    git(repo.root, "commit", "-qm", "orpheline")
    git(repo.root, "branch", "-qD", "main")
    write(repo.root, "ui/c.tsx", "export const c = 10\n")
    const result = runHook(repo, "stop", stopPayload(repo))
    expect(result.stderr).toContain("no-baseline")
    expect(toolCalls(repo, "vitest")[0]).toContain("ui/c.tsx")
  })

  it("erreur interne injectée : code 1, jamais 2, rien sur stdout", () => {
    const repo = makeRepo()
    write(repo.root, "ui/c.tsx", "debugger\n")
    writeFileSync(stateFile(repo, ""), "un fichier à la place du dossier d'état")
    const result = runHook(repo, "stop", stopPayload(repo))
    expect(result).toMatchObject({ code: 1, stdout: "" })
    expect(result.stderr).toContain("erreur interne")
  })
})

describe("lanceur et délégation", () => {
  it("sans scripts dans le worktree : ceux du checkout principal, signalé une fois par session", () => {
    const host = makeRepo()
    const bare = makeRepo({ scripts: false })
    write(bare.root, "ui/c.tsx", "export const c = 11\n")
    const first = runHook(bare, "stop", stopPayload(bare), { scriptsRoot: host.root })
    expect(first.code).toBe(0)
    expect(JSON.parse(first.stdout).systemMessage).toContain("Scripts de vérification absents de ce worktree")
    expect(toolCalls(bare, "vitest")).toHaveLength(1)
    write(bare.root, "ui/c.tsx", "export const c = 12\n")
    const second = runHook(bare, "stop", stopPayload(bare), { scriptsRoot: host.root })
    expect(second.code).toBe(0)
    expect(second.stdout).not.toContain("Scripts de vérification absents")
  })

  it("scripts présents dans le worktree : ils passent avant ceux du checkout principal", () => {
    const host = makeRepo()
    const worktree = makeRepo()
    write(worktree.root, ".claude/hooks/cli.mjs", "process.stdout.write(`scripts du worktree ${process.argv[2]}\\n`)\n")
    const result = runHook(worktree, "stop", stopPayload(worktree), { scriptsRoot: host.root })
    expect(result).toMatchObject({ code: 0, stdout: "scripts du worktree stop\n" })
  })

  it("choisit le Node de .node-version installé par nvm", () => {
    const repo = makeRepo({ files: { ".node-version": "v99.0.0\n" } })
    const marker = join(repo.dir, "nvm-node-used")
    const nodeBin = write(repo.home, ".nvm/versions/node/v99.0.0/bin/node", `#!/bin/sh\ntouch "${marker}"\nexec "${process.execPath}" "$@"\n`)
    chmodSync(nodeBin, 0o755)
    expect(runHook(repo, "stop", stopPayload(repo)).code).toBe(0)
    expect(existsSync(marker)).toBe(true)
  })
})
