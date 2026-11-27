import { spawn } from "node:child_process"
import { mkdtemp, readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { basename, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, it } from "vitest"

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url))
const vitestBin = join(dirname(createRequire(import.meta.url).resolve("vitest/package.json")), "vitest.mjs")
const config = fileURLToPath(new URL("./mock-isolation/vitest.config.ts", import.meta.url))

// Lance un Vitest complet : quelques secondes au calme, bien davantage sur une machine chargée.
const TIMEOUT_MS = 60_000

const runNestedVitest = (args: string[]) =>
  new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [vitestBin, ...args], { cwd: repoRoot, timeout: TIMEOUT_MS - 5_000 })
    let output = ""
    child.stdout.on("data", (chunk) => {
      output += chunk
    })
    child.stderr.on("data", (chunk) => {
      output += chunk
    })
    child.on("error", reject)
    child.on("close", (code) => resolve({ code, output }))
  })

it(
  "un mock par factory ne passe pas aux fichiers suivants du même worker",
  async () => {
    const reportPath = join(await mkdtemp(join(tmpdir(), "mock-isolation-")), "report.json")
    const run = await runNestedVitest(["run", "--config", config, "--reporter=json", `--outputFile.json=${reportPath}`])
    const report = await readFile(reportPath, "utf8").catch(() => {
      throw new Error(`Le Vitest imbriqué n'a pas produit de rapport (code ${run.code}) :\n${run.output}`)
    })
    const files = (JSON.parse(report).testResults as { name: string; status: string; startTime: number }[])
      .sort((a, b) => a.startTime - b.startTime)
      .map(({ name, status }) => [basename(name), status])

    expect(files).toEqual([
      ["1-factory.fixture.ts", "passed"],
      ["2-automock.fixture.ts", "passed"],
      ["3-factory.fixture.ts", "passed"],
      ["4-autospy.fixture.ts", "passed"],
      ["5-sans-mock.fixture.ts", "passed"],
    ])
    expect(run.code).toBe(0)
  },
  TIMEOUT_MS
)
