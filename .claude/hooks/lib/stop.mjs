import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { basename, join, relative } from "node:path"

import {
  attachNotice,
  countWindow,
  DB_ISOLATION_MARKER,
  DEFAULTS,
  decideCached,
  decideRun,
  formatDiagnostic,
  inScope,
  needsTypecheck,
  nextCycle,
  planTests,
  SERVER_PROJECTS,
} from "./decide.mjs"
import { diffTrees, EMPTY_TREE, fingerprint, hashFiles, headBlobs, headTree, listTestFiles, mergeBaseTree } from "./repo.mjs"
import { acquireLock, acquireSlot, markNotified, newLogDir, notifiedCauses, readJson, readText, sessionDir, sessionKey, sessionRootsDir, stateDir, writeJson } from "./state.mjs"
import { binPath, biomeFileCount, depsState, expectedNode, parseBiomeReport, parseTscErrors, parseVitestReport, probeMongo, runTool } from "./tools.mjs"

const number = (value, fallback) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback)

export function settings(env) {
  return {
    maxBlocks: number(env.LBA_HOOKS_MAX_BLOCKS, DEFAULTS.maxBlocks),
    budgetMs: number(env.LBA_HOOKS_BUDGET_S, DEFAULTS.budgetMs / 1000) * 1000,
    testWorkers: number(env.LBA_HOOKS_TEST_WORKERS, DEFAULTS.testWorkers),
    parallelTests: number(env.LBA_HOOKS_MAX_PARALLEL_TESTS, DEFAULTS.parallelTests),
    tests: ["direct", "off"].includes(env.LBA_HOOKS_TESTS) ? env.LBA_HOOKS_TESTS : "related",
    mongoMs: number(env.LBA_HOOKS_MONGO_TIMEOUT_MS, DEFAULTS.mongoMs),
  }
}

/** Un sous-agent n'est vérifié que s'il possède son worktree : sur l'arbre du parent, la garde du parent couvre. */
export function ownsWorktree(root, payload) {
  const recorded = readText(join(sessionRootsDir(root), sessionKey({ session_id: payload.session_id })))
  if (recorded) return recorded !== root
  return basename(root) === `agent-${payload.agent_id}`
}

export function sessionStart(ctx) {
  const { payload, root } = ctx
  const state = stateDir(root)
  const session = sessionDir(state, sessionKey(payload))
  const rootFile = join(sessionRootsDir(root), sessionKey({ session_id: payload.session_id }))
  if (!existsSync(rootFile)) writeFileSync(rootFile, `${root}\n`, { flag: "w" })
  const baseline = join(session, "baseline")
  if (existsSync(baseline)) return { exit: 0 }
  try {
    writeFileSync(baseline, `${fingerprint(root, state)}\n`, { flag: "wx" })
  } catch (error) {
    if (error.code !== "EEXIST") throw error
  }
  return { exit: 0 }
}

function environment(root, env, strict, config) {
  const deps = depsState(root)
  const expected = expectedNode(root)
  const tools = ["biome", "tsc", "vitest"].map((name) => (existsSync(binPath(root, name)) ? name : `-${name}`))
  return {
    deps,
    expected,
    nodeMismatch: expected && expected !== process.version ? `Node ${process.version} au lieu de ${expected} (.node-version)` : null,
    key: [process.version, deps.status, strict ? "strict" : "normal", config.tests, ...tools].join("|"),
  }
}

export async function stop(ctx) {
  const { payload, env, root } = ctx
  if (payload.hook_event_name === "SubagentStop" && !ownsWorktree(root, payload)) return { exit: 0 }

  const config = settings(env)
  const deadline = Date.now() + config.budgetMs
  const state = stateDir(root)
  const key = sessionKey(payload)
  const lock = await acquireLock(state, key, { timeoutMs: config.budgetMs })
  if (!lock.acquired) {
    if (lock.duplicate) return { exit: 0 }
    return { exit: 0, stdout: JSON.stringify({ systemMessage: "[lba-hooks] Garde non exécutée : une autre vérification occupe ce worktree au-delà du budget." }) }
  }
  try {
    return await guard({ ctx, config, deadline, state, key })
  } finally {
    lock.release()
  }
}

async function guard({ ctx, config, deadline, state, key }) {
  const { payload, env, root, strict } = ctx
  const session = sessionDir(state, key)
  const now = Date.now()
  const cycleFile = join(session, "cycle.json")
  const cycle = nextCycle(readJson(cycleFile), { promptId: payload.prompt_id, stopHookActive: payload.stop_hook_active, now })
  const done = (decision) => {
    writeJson(cycleFile, { ...cycle, lastVerdict: decision.verdict ?? "skipped" })
    return attachNotice(decision, ctx.fallbackNotice?.(state, key))
  }

  const tree = fingerprint(root, state)
  const sessionGreen = readText(join(session, "verified"))
  const baseline = readText(join(session, "baseline"))
  if (tree === sessionGreen || tree === baseline) return done({ verdict: "skipped", exit: 0 })

  const envInfo = environment(root, env, strict, config)
  const lastFile = join(state, "last-run.json")
  const last = readJson(lastFile)
  const notified = notifiedCauses(session)
  if (last && last.tree === tree && last.envKey === envInfo.key) {
    const decision = decideCached({ last, notified })
    if (decision.verdict !== last.verdict) writeJson(lastFile, { ...last, verdict: decision.verdict, releasedAt: new Date().toISOString(), session: key })
    markNotified(session, decision.notify)
    return done(decision)
  }

  const causes = []
  let reference = sessionGreen ?? baseline ?? mergeBaseTree(root)
  if (!reference) {
    causes.push({ id: "no-baseline" })
    reference = headTree(root) ?? EMPTY_TREE
  }
  const changes = diffTrees(root, reference, tree)
  const scoped = changes.filter((change) => inScope(change.path))
  const base = { envKey: envInfo.key, session: key, event: payload.hook_event_name ?? "Stop", at: new Date().toISOString(), reference }
  if (!scoped.length) {
    writeJson(lastFile, { ...base, tree, verdict: "skipped", causes: [], coverage: null })
    return done({ verdict: "skipped", exit: 0 })
  }

  const result = await verify({ root, state, changes: scoped, envInfo, config, deadline })
  result.causes.unshift(...causes)
  const blocksFile = join(session, "blocks.json")
  const blocks = readJson(blocksFile, [])
  const decision = decideRun({ result, cycle, windowCount: countWindow(blocks, now), notified, strict, maxBlocks: config.maxBlocks })
  if (decision.block) {
    cycle.blocks += 1
    writeJson(blocksFile, [...blocks.filter((at) => now - at < DEFAULTS.windowMs), now])
  }
  markNotified(session, decision.notify)
  writeJson(lastFile, {
    ...base,
    tree: result.tree,
    verdict: decision.verdict,
    causes: result.causes,
    coverage: result.coverage,
    failed: result.failed,
    report: result.report,
    log: result.log,
    files: scoped.map((change) => change.path),
  })
  if (decision.verdict === "green") {
    writeFileSync(join(session, "verified"), `${result.tree}\n`)
    writeJson(join(state, "verified.json"), { tree: result.tree, at: base.at, session: key, coverage: result.coverage })
  }
  return done(decision)
}

function lintReport(report, changedPaths) {
  const errors = report.diagnostics.filter((diagnostic) => diagnostic.severity === "error")
  const mine = errors.filter((diagnostic) => changedPaths.has(diagnostic.location?.path))
  const others = errors.filter((diagnostic) => !changedPaths.has(diagnostic.location?.path))
  const lines = [`Biome (biome ci .) : ${report.summary.errors} erreur(s)`]
  for (const diagnostic of mine.slice(0, 15)) lines.push(formatDiagnostic(diagnostic))
  if (others.length) {
    lines.push("Dans des fichiers hors de tes changements (antérieurs ?) :")
    for (const diagnostic of others.slice(0, Math.max(3, 15 - mine.length))) lines.push(formatDiagnostic(diagnostic))
  }
  if (report.summary.diagnosticsNotPrinted) lines.push(`… ${report.summary.diagnosticsNotPrinted} diagnostic(s) non affiché(s)`)
  return lines.join("\n")
}

function testsReport(root, parsed, code, logFile) {
  const lines = [`Tests : ${parsed.failedFiles} fichier(s) en échec sur ${parsed.files}${code ? ` (code ${code})` : ""}`]
  for (const failure of parsed.failures.slice(0, 10)) lines.push(`${relative(root, failure.file)} > ${failure.title} : ${failure.message.split("\n")[0]}`)
  if (!parsed.failures.length) lines.push(tail(logFile, 15))
  return lines.join("\n")
}

function tail(file, count) {
  try {
    return readFileSync(file, "utf8")
      .trimEnd()
      .split("\n")
      .filter((line) => !/^\s+at /.test(line))
      .slice(-count)
      .join("\n")
  } catch {
    return ""
  }
}

async function verify({ root, state, changes, envInfo, config, deadline }) {
  const log = newLogDir(state)
  const causes = []
  const failed = []
  const report = []
  const coverage = { lintFiles: null, typecheck: null, tests: null, node: process.version }
  const paths = changes.map((change) => change.path)
  const live = changes.filter((change) => change.status !== "D" && existsSync(join(root, change.path))).map((change) => change.path)
  const plan = planTests(changes, { listTests: (dir) => listTestFiles(root, dir), mode: config.tests === "direct" ? "direct" : "related" })
  const rerun = []
  const timeLeft = (cap) => Math.min(cap, deadline - Date.now())
  const timedOut = (what) => causes.push({ id: "tests-timeout", detail: what })

  const finish = () => ({ tree: fingerprint(root, state), failed, report: report.join("\n"), causes, coverage, log, rerun: rerun.join(" && ") })

  if (envInfo.nodeMismatch) causes.push({ id: "node-mismatch", detail: envInfo.nodeMismatch })
  if (envInfo.deps.status === "missing") {
    causes.push({ id: "deps-missing" })
    return finish()
  }
  if (envInfo.deps.status === "stale") {
    causes.push({ id: "deps-stale", detail: envInfo.deps.detail })
    return finish()
  }

  const biome = binPath(root, "biome")
  if (!existsSync(biome)) causes.push({ id: "biome-missing" })
  else {
    if (live.length) {
      const before = hashFiles(root, live)
      const write = await runTool(biome, ["check", "--write", "--no-errors-on-unmatched", "--files-ignore-unknown=true", "--colors=off", ...live], {
        cwd: root,
        timeoutMs: timeLeft(DEFAULTS.biomeMs),
        logFile: join(log, "biome-write.log"),
      })
      if (write.timedOut) {
        timedOut("biome check --write")
        return finish()
      }
      const after = hashFiles(root, live)
      const rewritten = live.filter((path) => before.get(path) !== after.get(path))
      const head = headBlobs(root, rewritten)
      const committed = rewritten.filter((path) => head.get(path) === before.get(path))
      if (committed.length) {
        failed.push("format")
        report.push(`Format : code commité non formaté, corrigé par biome check --write dans ${committed.join(", ")}. Committe cette correction.`)
      }
    }
    const ci = await runTool(biome, ["ci", "--reporter=json", "--colors=off", "--max-diagnostics=50", "."], {
      cwd: root,
      timeoutMs: timeLeft(DEFAULTS.biomeMs),
      logFile: join(log, "biome-ci.log"),
      captureStdout: true,
    })
    writeFileSync(join(log, "biome-ci.json"), ci.stdout)
    if (ci.timedOut) {
      timedOut("biome ci")
      return finish()
    }
    try {
      const parsed = parseBiomeReport(ci.stdout)
      coverage.lintFiles = biomeFileCount(parsed.summary)
      if (parsed.summary.errors > 0) {
        failed.push("lint")
        report.push(lintReport(parsed, new Set(paths)))
        rerun.push("yarn check:ci")
      }
    } catch (error) {
      causes.push({ id: "tool-error", detail: `biome ci (code ${ci.code}) : ${error.message}` })
    }
  }

  const wantTests = config.tests !== "off" && plan.args.length > 0
  if (needsTypecheck(paths) || wantTests) {
    const tsc = binPath(root, "tsc")
    if (!existsSync(tsc)) causes.push({ id: "tsc-missing" })
    else {
      const logFile = join(log, "tsc.log")
      const run = await runTool(tsc, ["-b", "ui/tsconfig.json", "server/tsconfig.json", "shared/tsconfig.json", "--pretty", "false"], {
        cwd: root,
        timeoutMs: timeLeft(DEFAULTS.tscMs),
        logFile,
      })
      if (run.timedOut) {
        timedOut("le typecheck")
        return finish()
      }
      coverage.typecheck = true
      if (run.code !== 0) {
        failed.push("typecheck")
        const errors = parseTscErrors(tail(logFile, 400))
        report.push([`Typecheck (tsc -b) : ${errors.length || "?"} erreur(s)`, ...(errors.length ? errors.slice(0, 15) : [tail(logFile, 15)])].join("\n"))
        rerun.push("yarn typecheck")
      }
    }
  }

  if (failed.length) return finish()
  if (config.tests === "off") {
    if (plan.args.length) causes.push({ id: "tests-off" })
    return finish()
  }
  for (const id of plan.causes) causes.push({ id, detail: id === "too-broad" ? String(changes.length) : undefined })
  if (!plan.args.length) {
    coverage.tests = { files: 0, projects: [] }
    return finish()
  }

  let projects = plan.projects
  if (projects.some((project) => SERVER_PROJECTS.includes(project))) {
    const isolated = existsSync(join(root, DB_ISOLATION_MARKER))
    if (!isolated) causes.push({ id: "no-db-isolation" })
    const probe = await probeMongo(root, config.mongoMs)
    if (!probe.ok) causes.push({ id: "mongo-unreachable", detail: probe.detail })
    if (!isolated || !probe.ok) projects = projects.filter((project) => !SERVER_PROJECTS.includes(project))
  }
  if (!projects.length) return finish()

  const vitest = binPath(root, "vitest")
  if (!existsSync(vitest)) {
    causes.push({ id: "vitest-missing" })
    return finish()
  }
  const release = await acquireSlot({ max: config.parallelTests, timeoutMs: Math.max(0, deadline - Date.now() - 10_000) })
  if (!release) {
    causes.push({ id: "busy" })
    return finish()
  }
  try {
    const jsonFile = join(log, "vitest.json")
    const logFile = join(log, "vitest.log")
    const projectArgs = projects.flatMap((project) => ["--project", project])
    const run = await runTool(
      vitest,
      ["related", "--run", `--maxWorkers=${config.testWorkers}`, "--reporter=default", "--reporter=json", `--outputFile.json=${jsonFile}`, ...plan.args, ...projectArgs],
      { cwd: root, timeoutMs: timeLeft(Number.POSITIVE_INFINITY) - 2_000, logFile }
    )
    if (run.timedOut) {
      timedOut("les tests")
      return finish()
    }
    const json = readJson(jsonFile)
    const command = `yarn vitest related --run ${plan.args.join(" ")} ${projectArgs.join(" ")}`
    if (!json) {
      if (run.code === 0) coverage.tests = { files: 0, projects }
      else {
        failed.push("tests")
        report.push([`Tests : Vitest a échoué (code ${run.code}) sans rapport JSON`, tail(logFile, 15)].join("\n"))
        rerun.push(command)
      }
      return finish()
    }
    const parsed = parseVitestReport(json)
    coverage.tests = { files: parsed.files, projects }
    if (parsed.failures.length || !parsed.success || run.code !== 0) {
      failed.push("tests")
      report.push(testsReport(root, parsed, run.code, logFile))
      rerun.push(command)
    }
  } finally {
    release()
  }
  return finish()
}
