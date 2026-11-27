import { join } from "node:path"
import { afterAll, describe, expect, it } from "vitest"

import { cleanup, git, makeRepo, runHook, stopPayload, write } from "./helpers.mjs"

afterAll(cleanup)

const status = (repo, ...args) => runHook(repo, "status", undefined, { args: ["--cwd", repo.root, ...args] })

describe("status", () => {
  it("aucun run : 5 avec scripts, 6 sans scripts", () => {
    expect(status(makeRepo()).code).toBe(5)
    const bare = makeRepo({ scripts: false })
    const host = makeRepo()
    expect(runHook(bare, "status", undefined, { args: ["--cwd", bare.root], scriptsRoot: host.root }).code).toBe(6)
  })

  it("vert à jour : 0, puis 5 dès que l'arbre change", () => {
    const repo = makeRepo()
    write(repo.root, "ui/c.tsx", "export const c = 2\n")
    expect(runHook(repo, "stop", stopPayload(repo)).code).toBe(0)
    const fresh = status(repo)
    expect(fresh.code).toBe(0)
    expect(fresh.stdout).toContain("green")
    write(repo.root, "ui/c.tsx", "export const c = 3\n")
    expect(status(repo).stdout).toContain("non vérifié : arbre modifié")
    expect(status(repo).code).toBe(5)
  })

  it("rouge, puis relâché : 4", () => {
    const repo = makeRepo()
    write(repo.root, "ui/c.tsx", "debugger\n")
    expect(runHook(repo, "stop", stopPayload(repo)).code).toBe(2)
    expect(status(repo).code).toBe(4)
    expect(runHook(repo, "stop", stopPayload(repo, { stop_hook_active: true })).code).toBe(1)
    expect(status(repo, "--json").code).toBe(4)
    expect(JSON.parse(status(repo, "--json").stdout)[0]).toMatchObject({ code: 4, root: repo.root })
  })

  it("--all : une ligne par worktree, code du plus grave", () => {
    const repo = makeRepo()
    const other = join(repo.dir, "autre-worktree")
    git(repo.root, "worktree", "add", "-q", "-b", "autre", other)
    write(repo.root, "ui/c.tsx", "debugger\n")
    runHook(repo, "stop", stopPayload(repo))
    const result = status(repo, "--all")
    expect(result.code).toBe(4)
    expect(result.stdout.trim().split("\n")).toHaveLength(2)
    expect(result.stdout).toContain(other)
  })
})

describe("explain", () => {
  it("affiche la décision sans lancer aucun outil", () => {
    const repo = makeRepo()
    write(repo.root, "shared/src/b.ts", "export const b = 2\n")
    const result = runHook(repo, "explain", stopPayload(repo))
    expect(result.code).toBe(0)
    expect(result.stdout).toContain("référence : ")
    expect(result.stdout).toContain("tests : shared/dist/src/b.js shared/src/b.ts --project server --project server-isolated --project shared --project ui")
    expect(repo.calls()).toEqual([])
  })
})
