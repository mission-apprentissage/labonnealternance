import { execFileSync, spawn, spawnSync } from "node:child_process"
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { serialize } from "node:v8"
import { gzipSync } from "node:zlib"

import { lockfileChecksum } from "../lib/tools.mjs"

export const HOOKS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..")
export const REPO_ROOT = resolve(HOOKS_DIR, "..", "..")

const temps = []

export function tempDir(prefix = "lba-hooks-test-") {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), prefix)))
  temps.push(dir)
  return dir
}

export function cleanup() {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true })
}

const GIT_ENV = {
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "Test",
  GIT_AUTHOR_EMAIL: "test@example.invalid",
  GIT_COMMITTER_NAME: "Test",
  GIT_COMMITTER_EMAIL: "test@example.invalid",
}

/** Environnement hermétique : ni nvm, ni config git de l'utilisateur, ni réglages LBA_HOOKS* du poste. */
export function hermeticEnv(home, extra = {}) {
  const env = {}
  for (const [name, value] of Object.entries(process.env)) {
    if (name.startsWith("LBA_HOOKS") || name.startsWith("GIT_") || name.startsWith("FAKE_") || name === "CLAUDE_PROJECT_DIR") continue
    env[name] = value
  }
  return {
    ...env,
    ...GIT_ENV,
    HOME: home,
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
    LBA_HOOKS_SLOTS_DIR: join(home, "slots"),
    ...extra,
  }
}

export function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, env: hermeticEnv(cwd), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
}

export function write(root, rel, content) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
  return file
}

export function read(root, rel) {
  return readFileSync(join(root, rel), "utf8")
}

const FAKE_BIOME = `#!/usr/bin/env node
// Faux Biome : journalise ses arguments ; un fichier qui contient "debugger" est une erreur, "WARNONLY" un avertissement,
// "/*unformatted*/" est retiré par check --write.
const fs = require("node:fs"), path = require("node:path")
const args = process.argv.slice(2)
fs.appendFileSync(process.env.FAKE_LOG, JSON.stringify(["biome", ...args]) + "\\n")
if (process.env.FAKE_BIOME === "crash") { process.stderr.write("panic\\n"); process.exit(3) }
const command = args[0]
const files = args.slice(1).filter((a) => !a.startsWith("-"))
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.name === "node_modules" || e.name.startsWith(".git") ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
const targets = command === "ci" ? walk(".").map((f) => path.relative(".", f)).filter((f) => /\\.(m?js|tsx?|json)$/.test(f)) : files.filter((f) => fs.existsSync(f) && /\\.(m?js|cjs|jsx?|tsx?|jsonc?)$/.test(f))
const diagnostics = []
let changed = 0
for (const file of targets) {
  let text = fs.readFileSync(file, "utf8")
  if (command === "check" && args.includes("--write") && text.includes("/*unformatted*/")) { text = text.replaceAll("/*unformatted*/", ""); fs.writeFileSync(file, text); changed++ }
  text.split("\\n").forEach((line, i) => {
    if (line.includes("debugger")) diagnostics.push({ severity: "error", message: "This is an unexpected use of the debugger statement.", category: "lint/suspicious/noDebugger", location: { path: file, start: { line: i + 1, column: line.indexOf("debugger") + 1 } } })
    if (line.includes("WARNONLY")) diagnostics.push({ severity: "warning", message: "warning only", category: "lint/style/fake", location: { path: file, start: { line: i + 1, column: 1 } } })
  })
}
const errors = diagnostics.filter((d) => d.severity === "error").length
const summary = { changed, unchanged: targets.length - changed, matches: 0, errors, warnings: diagnostics.length - errors, skipped: 0 }
process.stdout.write(JSON.stringify({ summary, diagnostics, command }))
process.exit(errors ? 1 : 0)
`

const FAKE_TSC = `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path")
fs.appendFileSync(process.env.FAKE_LOG, JSON.stringify(["tsc", ...process.argv.slice(2)]) + "\\n")
const walk = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : []
const bad = ["server", "ui", "shared"].flatMap(walk).filter((f) => /\\.tsx?$/.test(f) && fs.readFileSync(f, "utf8").includes("TYPE_ERROR"))
for (const f of bad) process.stdout.write(f + "(1,1): error TS2322: Type 'string' is not assignable to type 'number'.\\n")
process.exit(bad.length ? 2 : 0)
`

const FAKE_VITEST = `#!/usr/bin/env node
// Faux Vitest : un argument fichier de test est lancé, une source l'est par son voisin X.test.* ; "FAIL_ME" fait échouer.
const fs = require("node:fs"), path = require("node:path")
const args = process.argv.slice(2)
fs.appendFileSync(process.env.FAKE_LOG, JSON.stringify(["vitest", ...args]) + "\\n")
const wait = Number(process.env.FAKE_VITEST_SLEEP_MS || 0)
if (wait) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, wait)
const out = args.find((a) => a.startsWith("--outputFile.json="))?.split("=")[1]
const files = new Set()
const paths = args.filter((a, i) => !a.startsWith("-") && args[i - 1] !== "--project" && /\\.[a-z]+$/.test(a))
for (const a of paths) {
  if (/\\.test\\.[cm]?[jt]sx?$/.test(a)) { if (fs.existsSync(a)) files.add(a); continue }
  for (const ext of [".test.ts", ".test.tsx", ".test.mjs"]) { const t = a.replace(/\\.[cm]?[jt]sx?$/, ext); if (fs.existsSync(t)) files.add(t) }
}
const testResults = [...files].map((f) => {
  const failed = process.env.FAKE_VITEST === "red" || fs.readFileSync(f, "utf8").includes("FAIL_ME")
  return { name: path.resolve(f), status: failed ? "failed" : "passed", assertionResults: [{ fullName: "fake > it", status: failed ? "failed" : "passed", failureMessages: failed ? ["AssertionError: expected 1 to be 2"] : [] }] }
})
const success = testResults.every((r) => r.status === "passed")
if (out) fs.writeFileSync(out, JSON.stringify({ success, numTotalTestSuites: testResults.length, testResults }))
process.exit(success ? 0 : 1)
`

function installFakeTools(root) {
  const bin = join(root, "node_modules", ".bin")
  mkdirSync(bin, { recursive: true })
  for (const [name, source] of [
    ["biome", FAKE_BIOME],
    ["tsc", FAKE_TSC],
    ["vitest", FAKE_VITEST],
  ]) {
    writeFileSync(join(bin, name), source)
    chmodSync(join(bin, name), 0o755)
  }
}

/** État d'installation cohérent avec yarn.lock, comme après un `yarn install`. */
export function writeInstallState(root, checksum = lockfileChecksum(read(root, "yarn.lock"))) {
  mkdirSync(join(root, ".yarn"), { recursive: true })
  writeFileSync(join(root, ".yarn", "install-state.gz"), gzipSync(serialize({ lockFileChecksum: checksum })))
}

export function linkMongoDriver(root) {
  const entry = createRequire(join(REPO_ROOT, "server", "package.json")).resolve("mongodb")
  let pkg = dirname(entry)
  while (!pkg.endsWith(`${join("node_modules", "mongodb")}`)) pkg = dirname(pkg)
  execFileSync("ln", ["-s", pkg, join(root, "node_modules", "mongodb")])
}

const BASE_FILES = {
  "package.json": JSON.stringify({ name: "mna-lba", private: true }),
  "biome.json": "{}\n",
  "yarn.lock": "# lock\n",
  ".node-version": `${process.version}\n`,
  ".gitignore": "node_modules/\ndist/\n.yarn/\n*.local\nignored-*\n",
  "server/package.json": JSON.stringify({ name: "server", type: "module" }),
  "server/src/a.ts": "export const a = 1\n",
  "server/src/a.test.ts": "import { a } from './a'\n",
  "shared/src/b.ts": "export const b = 1\n",
  "shared/src/b.test.ts": "import { b } from './b'\n",
  "ui/c.tsx": "export const c = 1\n",
  "ui/c.test.tsx": "import { c } from './c'\n",
  "docs/notes.md": "# notes\n",
  ".github/workflows/ci.yml": "name: CI\n",
}

/**
 * Dépôt LBA minimal avec une copie des scripts de hooks et de faux outils.
 * @param {{files?: Record<string, string>, scripts?: boolean, tools?: boolean, installState?: boolean}} options
 */
export function makeRepo({ files = {}, scripts = true, tools = true, installState = true } = {}) {
  const dir = tempDir()
  const root = join(dir, "repo")
  const home = join(dir, "home")
  mkdirSync(root)
  mkdirSync(home)
  git(root, "init", "-q", "-b", "main")
  for (const [rel, content] of Object.entries({ ...BASE_FILES, ...files })) if (content !== null) write(root, rel, content)
  if (scripts) cpSync(HOOKS_DIR, join(root, ".claude", "hooks"), { recursive: true, filter: (src) => !src.includes(`${join("hooks", "tests")}`) })
  if (tools) installFakeTools(root)
  if (installState) writeInstallState(root)
  git(root, "add", "-A")
  git(root, "commit", "-q", "-m", "init")
  const fakeLog = join(dir, "fake.log")
  writeFileSync(fakeLog, "")
  return {
    dir,
    root,
    home,
    fakeLog,
    calls: () =>
      readFileSync(fakeLog, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line)),
    env: (extra = {}) => hermeticEnv(home, { FAKE_LOG: fakeLog, ...extra }),
  }
}

export function payload(repo, extra = {}) {
  return { session_id: "s1", cwd: repo.root, prompt_id: "p1", ...extra }
}

export function stopPayload(repo, extra = {}) {
  return payload(repo, { hook_event_name: "Stop", stop_hook_active: false, ...extra })
}

export function editPayload(repo, filePath, extra = {}) {
  return payload(repo, {
    hook_event_name: "PostToolUse",
    tool_name: "Edit",
    tool_use_id: `toolu_${Math.random().toString(36).slice(2)}`,
    tool_input: { file_path: filePath },
    ...extra,
  })
}

/** Lance run.sh comme le câblage : process cwd différent du `cwd` de la charge. */
export function runHook(repo, command, input, { env = {}, scriptsRoot = repo.root, args = [] } = {}) {
  const started = Date.now()
  const run = spawnSync("bash", [join(scriptsRoot, ".claude", "hooks", "run.sh"), command, ...args], {
    cwd: repo.dir,
    input: input === undefined ? "" : typeof input === "string" ? input : JSON.stringify(input),
    env: repo.env(env),
    encoding: "utf8",
  })
  return { code: run.status, stdout: run.stdout, stderr: run.stderr, ms: Date.now() - started }
}

export function runHookAsync(repo, command, input, { env = {} } = {}) {
  return new Promise((done) => {
    const child = spawn("bash", [join(repo.root, ".claude", "hooks", "run.sh"), command], { cwd: repo.dir, env: repo.env(env) })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => {
      stdout += chunk
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk
    })
    child.on("close", (code) => done({ code, stdout, stderr }))
    child.stdin.end(JSON.stringify(input))
  })
}

export function stateFile(repo, rel, root = repo.root) {
  const gitDir = git(root, "rev-parse", "--absolute-git-dir").trim()
  return join(gitDir, "lba-hooks", rel)
}

export function lastRun(repo, root = repo.root) {
  try {
    return JSON.parse(readFileSync(stateFile(repo, "last-run.json", root), "utf8"))
  } catch {
    return null
  }
}
