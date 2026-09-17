#!/usr/bin/env node
// Stub de l'API Notion v3 non officielle.
// - rejoue des réponses réelles enregistrées sur disque (1 seul vrai appel amont par requête distincte)
// - compte les hits (= ce que la prod enverrait à app.notion.com)
// - modes: normal | 429 | flaky (429 les N premiers hits puis normal) | sync429 | degraded
//
// Usage: MODE=429 PORT=4545 node ui/scripts/notion-api-stub.mjs
// puis: NOTION_API_BASE_URL=http://localhost:4545/api/v3 yarn workspace ui build && npx next start
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURES = process.env.FIXTURES_DIR ?? join(__dirname, ".notion-fixtures")
const UPSTREAM = "https://app.notion.com/api/v3"
const PORT = Number(process.env.PORT ?? 4545)
let mode = process.env.MODE ?? "normal"
let flakyCount = Number(process.env.FLAKY ?? 2)

if (!existsSync(FIXTURES)) mkdirSync(FIXTURES, { recursive: true })

const hits = []

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = ""
    req.on("data", (c) => (raw += c))
    req.on("end", () => resolve(raw))
  })

const fixturePath = (endpoint, body) => join(FIXTURES, `${endpoint}-${createHash("sha1").update(body).digest("hex").slice(0, 12)}.json`)

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (url.pathname === "/__stats") {
    res.writeHead(200, { "content-type": "application/json" })
    return res.end(JSON.stringify({ mode, total: hits.length, byEndpoint: hits.reduce((acc, h) => ({ ...acc, [h]: (acc[h] ?? 0) + 1 }), {}) }))
  }
  if (url.pathname === "/__reset") {
    hits.length = 0
    if (url.searchParams.get("mode")) mode = url.searchParams.get("mode")
    if (url.searchParams.get("flaky")) flakyCount = Number(url.searchParams.get("flaky"))
    res.writeHead(200, { "content-type": "application/json" })
    return res.end(JSON.stringify({ ok: true, mode, flakyCount }))
  }

  const endpoint = url.pathname.split("/").pop()
  const body = await readBody(req)
  hits.push(endpoint)

  // sync429   : 429 uniquement sur la récupération des blocs manquants (blocs synchronisés)
  // degraded  : syncRecordValuesMain répond 200 mais avec `role: none` (dégradation silencieuse)
  const shouldFail = mode === "429" || (mode === "flaky" && hits.length <= flakyCount) || (mode === "sync429" && endpoint === "syncRecordValuesMain")
  if (shouldFail) {
    res.writeHead(429, { "content-type": "application/json" })
    return res.end(JSON.stringify({ errorId: "stub", name: "RateLimited", message: "Too many requests" }))
  }

  const file = fixturePath(endpoint, body)
  if (!existsSync(file)) {
    const upstream = await fetch(`${UPSTREAM}/${endpoint}`, { method: "POST", headers: { "content-type": "application/json" }, body })
    const text = await upstream.text()
    if (!upstream.ok) {
      console.error(`[stub] upstream ${endpoint} -> ${upstream.status}`)
      res.writeHead(upstream.status, { "content-type": "application/json" })
      return res.end(text)
    }
    writeFileSync(file, text)
    console.log(`[stub] fixture enregistrée ${endpoint} (${text.length} o)`)
  }

  let payload = readFileSync(file, "utf8")
  if (mode === "degraded" && endpoint === "syncRecordValuesMain") {
    const parsed = JSON.parse(payload)
    for (const id of Object.keys(parsed.recordMap?.block ?? {})) {
      parsed.recordMap.block[id] = { spaceId: parsed.recordMap.block[id].spaceId, value: { role: "none" } }
    }
    payload = JSON.stringify(parsed)
  }

  res.writeHead(200, { "content-type": "application/json" })
  res.end(payload)
})

server.listen(PORT, () => console.log(`[stub] http://localhost:${PORT}/api/v3 mode=${mode}`))
