import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { evaluate, extractCssHrefs, findForbiddenPackages, MeasureError, main, readSourceMapSources, routeHtmlFile } from "./perf-budget.mjs"

type ChunkSpec = {
  /** Nom du fichier chunk, ex. "aaa.js". */
  name: string
  /** Nom du fichier map. Volontairement différent du chunk : c'est ce que fait Turbopack. */
  mapName?: string | null
  /** Chemins sources tels qu'ils apparaissent dans la sourcemap. */
  sources?: string[]
  /** Map "indexée" (sections[].map.sources) comme Turbopack, ou map plate. */
  indexed?: boolean
  /** Écrit une map de forme non reconnue (ni sources ni sections). */
  unknownShape?: boolean
}

type BuildSpec = {
  chunks: ChunkSpec[]
  routes: { route: string; chunks: string[]; rawBytes?: number }[]
  html?: Record<string, string>
}

let uiDir: string

function writeChunk(spec: ChunkSpec) {
  const chunkPath = path.join(uiDir, ".next", "static", "chunks", spec.name)
  const mapName = spec.mapName === undefined ? spec.name.replace(/\.js$/, ".map-hash-differente.js.map") : spec.mapName
  const body = `console.log("${spec.name}");${"/* padding compressible */".repeat(20)}\n`
  writeFileSync(chunkPath, mapName === null ? body : `${body}//# sourceMappingURL=${mapName}\n`)

  if (mapName === null) {
    return
  }
  const sources = spec.sources ?? []
  const map = spec.unknownShape
    ? { version: 3, unexpected: true }
    : spec.indexed === false
      ? { version: 3, sources }
      : { version: 3, sources: [], sections: [{ offset: { line: 0, column: 0 }, map: { version: 3, sources } }] }
  writeFileSync(path.join(uiDir, ".next", "static", "chunks", mapName), JSON.stringify(map))
}

function makeBuild(spec: BuildSpec) {
  mkdirSync(path.join(uiDir, ".next", "static", "chunks"), { recursive: true })
  mkdirSync(path.join(uiDir, ".next", "diagnostics"), { recursive: true })
  mkdirSync(path.join(uiDir, ".next", "server", "app"), { recursive: true })

  for (const chunk of spec.chunks) {
    writeChunk(chunk)
  }
  writeFileSync(
    path.join(uiDir, ".next", "diagnostics", "route-bundle-stats.json"),
    JSON.stringify(
      spec.routes.map((route) => ({
        route: route.route,
        firstLoadUncompressedJsBytes: route.rawBytes ?? 1000,
        firstLoadChunkPaths: route.chunks.map((name) => path.join(".next", "static", "chunks", name)),
      }))
    )
  )
  for (const [file, content] of Object.entries(spec.html ?? {})) {
    writeFileSync(path.join(uiDir, ".next", "server", "app", file), content)
  }
}

function writeConfig(config: unknown) {
  const configPath = path.join(uiDir, "perf-budget.json")
  writeFileSync(configPath, JSON.stringify(config))
  return configPath
}

function run(config: unknown, flags: string[] = []) {
  const configPath = writeConfig(config)
  return main([`--ui-dir=${uiDir}`, `--config=${configPath}`, ...flags])
}

const PHONE_SOURCE = "turbopack:///[project]/node_modules/libphonenumber-js/min/exports/parsePhoneNumber.js"

beforeEach(() => {
  uiDir = mkdtempSync(path.join(tmpdir(), "perf-budget-"))
  vi.spyOn(console, "log").mockImplementation(() => undefined)
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  rmSync(uiDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe("détection d'un package sur le first-load — faux positifs d'abord", () => {
  it("ne signale pas un package présent seulement dans un chunk hors first-load (near-miss)", () => {
    makeBuild({
      chunks: [
        { name: "home.js", sources: ["turbopack:///[project]/ui/app/page.tsx"] },
        { name: "ailleurs.js", sources: [PHONE_SOURCE] },
      ],
      routes: [{ route: "/", chunks: ["home.js"] }],
    })

    const report = evaluate({
      uiDir,
      config: { routes: { "/": { firstLoadJsGzip: null } }, forbiddenOnFirstLoad: { "/": ["libphonenumber-js"] } },
    })

    expect(report.forbidden).toEqual([{ route: "/", pkg: "libphonenumber-js", chunks: [] }])
    expect(report.violations).toEqual([])
  })

  it("ne confond pas un homonyme plus long (libphonenumber-js-mock) avec le package interdit", () => {
    makeBuild({
      chunks: [{ name: "home.js", sources: ["turbopack:///[project]/node_modules/libphonenumber-js-mock/index.js"] }],
      routes: [{ route: "/", chunks: ["home.js"] }],
    })

    const report = evaluate({
      uiDir,
      config: { routes: { "/": { firstLoadJsGzip: null } }, forbiddenOnFirstLoad: { "/": ["libphonenumber-js"] } },
    })

    expect(report.forbidden[0].chunks).toEqual([])
  })

  it("détecte le package même quand la sourcemap porte un hash différent du chunk", () => {
    // Non-vacuité : avec un `chunk + ".map"` naïf, aucune map n'est résolue et ce test échoue.
    makeBuild({
      chunks: [{ name: "home.js", mapName: "tout-autre-hash.js.map", sources: [PHONE_SOURCE] }],
      routes: [{ route: "/", chunks: ["home.js"] }],
    })

    const report = evaluate({
      uiDir,
      config: { routes: { "/": { firstLoadJsGzip: null } }, forbiddenOnFirstLoad: { "/": ["libphonenumber-js"] } },
    })

    expect(report.forbidden[0].chunks).toEqual([path.join(".next", "static", "chunks", "home.js")])
    expect(report.violations).toEqual(["libphonenumber-js sur /"])
  })

  it("lit les sources d'une map indexée comme d'une map plate", () => {
    makeBuild({
      chunks: [
        { name: "indexed.js", sources: [PHONE_SOURCE], indexed: true },
        { name: "plate.js", sources: [PHONE_SOURCE], indexed: false },
      ],
      routes: [{ route: "/", chunks: ["indexed.js", "plate.js"] }],
    })

    const { hits } = findForbiddenPackages(uiDir, [path.join(".next", "static", "chunks", "indexed.js"), path.join(".next", "static", "chunks", "plate.js")], ["libphonenumber-js"])

    expect(hits.get("libphonenumber-js")).toHaveLength(2)
  })

  it("tolère un chunk généré sans aucune source dès qu'un autre chunk est tracé", () => {
    makeBuild({
      chunks: [
        { name: "runtime.js", sources: [] },
        { name: "home.js", sources: [PHONE_SOURCE] },
      ],
      routes: [{ route: "/", chunks: ["runtime.js", "home.js"] }],
    })

    const scan = findForbiddenPackages(uiDir, [path.join(".next", "static", "chunks", "runtime.js"), path.join(".next", "static", "chunks", "home.js")], ["libphonenumber-js"])

    expect(scan.chunksAnalysed).toBe(2)
    expect(scan.chunksWithSources).toBe(1)
    expect(scan.hits.get("libphonenumber-js")).toHaveLength(1)
  })
})

describe("erreurs de mesure — jamais assouplies par --report-only", () => {
  it("échoue quand un chunk ne déclare aucune sourcemap", () => {
    makeBuild({
      chunks: [{ name: "home.js", mapName: null }],
      routes: [{ route: "/", chunks: ["home.js"] }],
    })

    expect(run({ routes: { "/": { firstLoadJsGzip: null } }, forbiddenOnFirstLoad: { "/": ["libphonenumber-js"] } }, ["--report-only"])).toBe(1)
  })

  it("échoue quand aucun chunk de la route n'a de source exploitable", () => {
    makeBuild({
      chunks: [
        { name: "a.js", sources: [] },
        { name: "b.js", sources: [] },
      ],
      routes: [{ route: "/", chunks: ["a.js", "b.js"] }],
    })

    expect(run({ routes: { "/": { firstLoadJsGzip: null } }, forbiddenOnFirstLoad: { "/": ["libphonenumber-js"] } }, ["--report-only"])).toBe(1)
  })

  it("échoue sur une sourcemap de forme non reconnue", () => {
    makeBuild({
      chunks: [{ name: "home.js", unknownShape: true }],
      routes: [{ route: "/", chunks: ["home.js"] }],
    })

    expect(() => readSourceMapSources(path.join(uiDir, ".next", "static", "chunks", "home.map-hash-differente.js.map"))).toThrow(MeasureError)
  })

  it("échoue quand la route demandée est absente des stats", () => {
    makeBuild({
      chunks: [{ name: "home.js", sources: ["turbopack:///[project]/ui/app/page.tsx"] }],
      routes: [{ route: "/", chunks: ["home.js"] }],
    })

    expect(run({ routes: { "/inconnue": { firstLoadJsGzip: null } } }, ["--report-only"])).toBe(1)
  })

  it("échoue quand route-bundle-stats.json est absent", () => {
    mkdirSync(path.join(uiDir, ".next"), { recursive: true })

    expect(run({ routes: { "/": { firstLoadJsGzip: null } } }, ["--report-only"])).toBe(1)
  })

  it("échoue quand un budget CSS est demandé sur une route sans HTML prérendu", () => {
    makeBuild({
      chunks: [{ name: "home.js", sources: ["turbopack:///[project]/ui/app/page.tsx"] }],
      routes: [{ route: "/", chunks: ["home.js"] }],
    })

    expect(run({ routes: { "/": { firstLoadJsGzip: null, firstLoadCssGzip: null } } }, ["--report-only"])).toBe(1)
  })
})

describe("feuilles CSS du first-load", () => {
  it("compte les stylesheet et les preload as=style, sans doublon", () => {
    const html = `<link rel="stylesheet" href="/_next/static/chunks/a.css" data-precedence="next"/>
      <link rel="preload" href="/_next/static/chunks/b.css" as="style"/>
      <link rel="stylesheet" href="/_next/static/chunks/a.css"/>
      <script src="/_next/static/chunks/x.js"></script>`

    expect(extractCssHrefs(html)).toEqual(["/_next/static/chunks/a.css", "/_next/static/chunks/b.css"])
  })

  it("mesure les feuilles référencées par le HTML de la route", () => {
    makeBuild({
      chunks: [{ name: "home.js", sources: ["turbopack:///[project]/ui/app/page.tsx"] }],
      routes: [{ route: "/", chunks: ["home.js"] }],
      html: {
        "index.html": `<link rel="stylesheet" href="/_next/static/chunks/dsfr.css"/><link rel="preload" href="/_next/static/chunks/page.css" as="style"/>`,
      },
    })
    writeFileSync(path.join(uiDir, ".next", "static", "chunks", "dsfr.css"), ".a{color:red}".repeat(500))
    writeFileSync(path.join(uiDir, ".next", "static", "chunks", "page.css"), ".b{color:blue}".repeat(10))

    const report = evaluate({ uiDir, config: { routes: { "/": { firstLoadJsGzip: null, firstLoadCssGzip: null } } } })
    const css = report.rows.find((row) => row.kind === "css")

    expect(css.detail).toBe("2 feuilles")
    expect(css.measured).toBeGreaterThan(0)
  })

  it("mappe la route sur son fichier HTML", () => {
    expect(routeHtmlFile("/")).toBe("index.html")
    expect(routeHtmlFile("/recherche")).toBe("recherche.html")
  })
})

describe("jugement des seuils", () => {
  function buildAtSize() {
    makeBuild({
      chunks: [{ name: "home.js", sources: ["turbopack:///[project]/ui/app/page.tsx"] }],
      routes: [{ route: "/", chunks: ["home.js"], rawBytes: 2_000 }],
    })
    return evaluate({ uiDir, config: { routes: { "/": { firstLoadJsGzip: null } } } }).rows[0].measured
  }

  it("passe quand la mesure est pile au seuil, dépasse à un octet près", () => {
    const measured = buildAtSize()

    expect(evaluate({ uiDir, config: { routes: { "/": { firstLoadJsGzip: measured } } } }).violations).toEqual([])
    expect(evaluate({ uiDir, config: { routes: { "/": { firstLoadJsGzip: measured - 1 } } } }).violations).toEqual(["JS first-load /"])
  })

  it("n'échoue pas en --report-only mais échoue en mode strict", () => {
    const measured = buildAtSize()
    const config = { routes: { "/": { firstLoadJsGzip: measured - 1 } } }

    expect(run(config, ["--report-only"])).toBe(0)
    expect(run(config)).toBe(1)
  })

  it("signale un seuil non renseigné, et échoue en mode strict", () => {
    buildAtSize()
    const config = { routes: { "/": { firstLoadJsGzip: null } } }

    expect(run(config, ["--report-only"])).toBe(0)
    expect(run(config)).toBe(1)
  })

  it("retient la route la plus lourde pour le plafond global", () => {
    makeBuild({
      chunks: [
        { name: "home.js", sources: ["turbopack:///[project]/ui/app/page.tsx"] },
        { name: "lourd.js", sources: ["turbopack:///[project]/ui/app/lourd/page.tsx"] },
      ],
      routes: [
        { route: "/", chunks: ["home.js"], rawBytes: 1_000 },
        { route: "/lourd", chunks: ["lourd.js"], rawBytes: 9_000 },
      ],
    })

    const report = evaluate({ uiDir, config: { routes: {}, globalMaxFirstLoadJsRaw: 8_999 } })
    const global = report.rows.find((row) => row.kind === "global")

    expect(global.route).toBe("/lourd")
    expect(global.measured).toBe(9_000)
    expect(report.violations).toEqual(["JS first-load max (toutes routes, brut)"])
  })
})
