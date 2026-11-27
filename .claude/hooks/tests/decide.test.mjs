import { readFileSync } from "node:fs"
import { join, matchesGlob, relative, resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { configDefaults } from "vitest/config"

import vitestConfig from "../../../vitest.config.ts"
import { decideCached, decideRun, inScope, isGlobalTrigger, LINT_EXTENSIONS, needsTypecheck, nextCycle, planTests, SERVER_PROJECTS, WORKSPACE_PROJECTS } from "../lib/decide.mjs"
import { REPO_ROOT } from "./helpers.mjs"

const change = (path, status = "M") => ({ path, status })
const coverage = { lintFiles: 10, typecheck: true, tests: { files: 2, projects: ["ui"] }, node: "v26.13.1" }
const red = { failed: ["tests"], report: "Tests : 1 fichier(s) en échec sur 1", causes: [], coverage }
const green = { failed: [], report: "", causes: [], coverage }

describe("périmètre et plan de tests : faux positifs", () => {
  it("ne met dans le périmètre ni la doc, ni les workflows, ni un .md de workspace", () => {
    for (const path of ["docs/notes.md", ".github/workflows/ci.yml", "README.md", "ui/AGENTS.md", "server/README.md", ".husky/pre-commit"]) {
      expect(inScope(path), path).toBe(false)
    }
  })

  it("met dans le périmètre le code, les configs racine, les hooks et tout fichier géré par Biome", () => {
    for (const path of [
      "server/src/a.ts",
      "ui/c.tsx",
      "shared/src/b.ts",
      "package.json",
      "biome.json",
      ".claude/hooks/run.sh",
      ".github/pr-title-checker-config.json",
      "server/src/x.mjml",
    ]) {
      expect(inScope(path), path).toBe(true)
    }
  })

  it("ne passe jamais package.json ni aucun déclencheur global à vitest related", () => {
    const plan = planTests([change("package.json"), change("server/package.json"), change("yarn.lock"), change("server/tests/utils/setup.ts"), change("ui/c.tsx")])
    expect(plan.args).toEqual(["ui/c.tsx"])
    expect(plan.causes).toContain("global-change")
    for (const arg of plan.args) expect(isGlobalTrigger(arg)).toBe(false)
  })

  it("ne passe pas un fichier supprimé", () => {
    const plan = planTests([change("server/src/gone.ts", "D"), change("server/src/gone.test.ts", "D")])
    expect(plan).toEqual({ args: [], projects: [], causes: [] })
  })

  it("au-delà de 60 fichiers, ne garde que les fichiers de test modifiés", () => {
    const many = Array.from({ length: 61 }, (_, i) => change(`ui/f${i}.tsx`))
    const plan = planTests([...many, change("ui/f0.test.tsx")])
    expect(plan.args).toEqual(["ui/f0.test.tsx"])
    expect(plan.causes).toEqual(["too-broad"])
  })

  it("ignore les fichiers hors workspace même dans le périmètre", () => {
    expect(planTests([change(".github/pr-title-checker-config.json"), change("biome.json")]).args).toEqual([])
  })
})

describe("plan de tests : cas nominaux", () => {
  it("relie shared/src par son chemin dist aux projets server, ui et shared", () => {
    const plan = planTests([change("shared/src/helpers/x.ts")])
    expect(plan.args).toEqual(["shared/dist/src/helpers/x.js", "shared/src/helpers/x.ts"])
    expect(plan.projects).toEqual(["server", "server-isolated", "shared", "ui"])
  })

  it("lance un fichier de test pour lui-même, dans son projet", () => {
    expect(planTests([change("ui/app/x.test.tsx")])).toEqual({ args: ["ui/app/x.test.tsx"], projects: ["ui"], causes: [] })
    expect(planTests([change("server/src/x.test.ts")]).projects).toEqual(SERVER_PROJECTS)
  })

  it("relie un snapshot à son test et un gabarit aux tests de son dossier", () => {
    expect(planTests([change("server/src/__snapshots__/mail.test.ts.snap")]).args).toEqual(["server/src/mail.test.ts"])
    const listTests = (dir) => (dir === "server/src/templates" ? ["server/src/templates/render.test.ts"] : [])
    expect(planTests([change("server/src/templates/mail.mjml")], { listTests }).args).toEqual(["server/src/templates/render.test.ts"])
  })

  it("lance les tests des hooks pour une modification de run.sh", () => {
    const listTests = (dir) => (dir === ".claude/hooks/tests" ? [".claude/hooks/tests/stop.test.mjs"] : [])
    expect(planTests([change(".claude/hooks/run.sh")], { listTests })).toEqual({ args: [".claude/hooks/tests/stop.test.mjs"], projects: ["hooks"], causes: [] })
  })

  it("demande le typecheck pour du TypeScript ou une config, pas pour du CSS seul", () => {
    expect(needsTypecheck(["ui/styles.css"])).toBe(false)
    expect(needsTypecheck(["ui/c.tsx"])).toBe(true)
    expect(needsTypecheck(["server/tsconfig.json"])).toBe(true)
  })
})

describe("constantes re-dérivées de leur source", () => {
  const packageJson = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"))

  it("extensions lintées à l'édition = celles de lint-staged qui lancent Biome", () => {
    const pattern = Object.entries(packageJson["lint-staged"]).find(([, commands]) => commands.some((command) => command.startsWith("biome ")))
    expect(pattern, "aucune entrée Biome dans lint-staged").toBeDefined()
    const extensions = pattern[0].match(/^\*\.\{(.+)\}$/)[1].split(",")
    expect([...LINT_EXTENSIONS].sort()).toEqual(extensions.sort())
  })

  it("projets Vitest = ceux de vitest.config.ts, rattachés au bon dossier", () => {
    const projects = vitestConfig.test.projects.map((project) => {
      const name = typeof project.test.name === "string" ? project.test.name : project.test.name.label
      return { name, root: relative(REPO_ROOT, resolve(REPO_ROOT, project.test.root)) }
    })
    expect(projects.length).toBeGreaterThan(0)
    expect(projects.map((project) => project.name).sort()).toEqual(Object.values(WORKSPACE_PROJECTS).flat().sort())
    for (const { name, root } of projects) expect(WORKSPACE_PROJECTS[root], `${name} (${root})`).toContain(name)
  })

  it("fichiers de setup des projets Vitest = déclencheurs globaux", () => {
    const setups = vitestConfig.test.projects.flatMap((project) =>
      [...(project.test.setupFiles ?? []), ...(project.test.globalSetup ?? [])].map((file) => relative(REPO_ROOT, resolve(REPO_ROOT, project.test.root, file)))
    )
    expect(setups.length).toBeGreaterThan(0)
    for (const setup of setups) expect(isGlobalTrigger(setup), setup).toBe(true)
  })

  it("forceRerunTriggers de Vitest = déclencheurs globaux", () => {
    expect(configDefaults.forceRerunTriggers.length).toBeGreaterThan(0)
    const samples = ["package.json", "server/package.json", "vitest.config.ts", "vite.config.mjs", "ui/vitest.config.mts", "ui/c.tsx", "server/src/package-json.ts"]
    const matched = samples.filter((sample) => configDefaults.forceRerunTriggers.some((glob) => matchesGlob(sample, glob) || matchesGlob(`${sample}/x`, glob)))
    expect(matched.length).toBeGreaterThan(0)
    for (const sample of samples) expect(isGlobalTrigger(sample), sample).toBe(matched.includes(sample))
  })
})

describe("anti-boucle", () => {
  const run = (sequence) => {
    let cycle = null
    let lastVerdict = null
    const codes = []
    for (const { stopHookActive, promptId = "p1", result = red } of sequence) {
      cycle = nextCycle(cycle && { ...cycle, lastVerdict }, { promptId, stopHookActive, now: 0 })
      const decision = decideRun({ result, cycle, windowCount: 0, notified: [], strict: false })
      if (decision.block) cycle = { ...cycle, blocks: cycle.blocks + 1 }
      lastVerdict = decision.verdict
      codes.push(decision.exit)
    }
    return codes
  }

  it("5 rouges en continuation : 2 2 2 1 1", () => {
    expect(run(Array.from({ length: 5 }, () => ({ stopHookActive: true })))).toEqual([2, 2, 2, 1, 1])
  })

  it("5 rouges avec stop_hook_active à false et le même prompt : 2 2 2 1 1", () => {
    expect(run(Array.from({ length: 5 }, () => ({ stopHookActive: false })))).toEqual([2, 2, 2, 1, 1])
  })

  it("5 rouges sans prompt_id ni stop_hook_active : 2 2 2 1 1", () => {
    expect(run(Array.from({ length: 5 }, () => ({ stopHookActive: false, promptId: null })))).toEqual([2, 2, 2, 1, 1])
  })

  it("un nouveau message de l'utilisateur rouvre un cycle", () => {
    expect(run([{ stopHookActive: false }, { stopHookActive: true }, { stopHookActive: true }, { stopHookActive: true }, { stopHookActive: false, promptId: "p2" }])).toEqual([
      2, 2, 2, 1, 2,
    ])
  })

  it("prompt_id constant : après un vert, un nouveau rouge bloque de nouveau", () => {
    expect(run([{ stopHookActive: false }, { stopHookActive: false, result: green }, { stopHookActive: false }])).toEqual([2, 0, 2])
  })

  it("plafond de 6 blocages sur la fenêtre glissante", () => {
    const decision = decideRun({ result: red, cycle: { blocks: 0 }, windowCount: 6, notified: [], strict: false })
    expect(decision).toMatchObject({ verdict: "released", exit: 1, block: false })
  })

  it("rouge sur arbre inchangé : relâche immédiate, jamais rebloqué", () => {
    expect(decideCached({ last: { verdict: "red", report: "x" }, notified: [] })).toMatchObject({ verdict: "released", exit: 1 })
    expect(decideCached({ last: { verdict: "released", report: "x" }, notified: [] })).toMatchObject({ verdict: "released", exit: 1 })
  })
})

describe("dégradations", () => {
  const degraded = { ...green, causes: [{ id: "mongo-unreachable", detail: "127.0.0.1:1" }, { id: "no-db-isolation" }] }

  it("premier signal au modèle en un seul code 2, puis message à l'utilisateur", () => {
    const first = decideRun({ result: degraded, cycle: { blocks: 0 }, windowCount: 0, notified: [], strict: false })
    expect(first).toMatchObject({ verdict: "degraded", exit: 2, block: false })
    expect(first.stderr).toContain("INFORMATION")
    expect(first.notify.sort()).toEqual(["mongo-unreachable", "no-db-isolation"])
    const next = decideRun({ result: degraded, cycle: { blocks: 0 }, windowCount: 0, notified: first.notify, strict: false })
    expect(next).toMatchObject({ verdict: "degraded", exit: 0 })
    expect(JSON.parse(next.stdout).systemMessage).toContain("mongo-unreachable")
  })

  it("mode strict : la dégradation bloque, puis relâche au plafond", () => {
    expect(decideRun({ result: degraded, cycle: { blocks: 0 }, windowCount: 0, notified: [], strict: true })).toMatchObject({ exit: 2, block: true })
    expect(decideRun({ result: degraded, cycle: { blocks: 3 }, windowCount: 0, notified: [], strict: true })).toMatchObject({ exit: 1, verdict: "released" })
  })

  it("aucun test lié ne s'écrit jamais « vert » sur les tests", () => {
    const decision = decideRun({
      result: { ...green, coverage: { ...coverage, tests: { files: 0, projects: [] } } },
      cycle: { blocks: 0 },
      windowCount: 0,
      notified: [],
      strict: false,
    })
    expect(JSON.parse(decision.stdout).systemMessage).toContain("tests : aucun fichier lié")
    expect(JSON.parse(decision.stdout).systemMessage).not.toMatch(/tests? verts?/)
  })
})
