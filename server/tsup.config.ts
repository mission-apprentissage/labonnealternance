// eslint-disable-next-line import/no-extraneous-dependencies
import fs from "node:fs"
import path, { basename } from "node:path"
import { fileURLToPath } from "node:url"

import { defineConfig } from "tsup"

const __dirname = (filePath: string): string => {
  const __filename = fileURLToPath(filePath)
  return path.dirname(__filename)
}

export default defineConfig((options) => {
  const isDev = options.env?.NODE_ENV !== "production"
  const isWatched = options.env?.TSUP_WATCH === "true"
  const migrationFiles = fs.readdirSync(path.join(__dirname(import.meta.url), "./src/migrations"))

  const entry: Record<string, string> = {
    index: "src/index.ts",
  }

  for (const file of migrationFiles) {
    entry[`migrations/${basename(file, ".ts")}`] = `src/migrations/${file}`
  }

  return {
    entry,
    watch: isWatched ? ["./src", "../shared/dist"] : false,
    onSuccess: isWatched ? "yarn cli start --withProcessor" : "",
    // In watch mode doesn't exit cleanly as it causes EADDRINUSE error
    killSignal: "SIGKILL",
    target: "es2024",
    platform: "node",
    format: ["esm"],
    splitting: true,
    shims: false,
    minify: false,
    sourcemap: true,
    noExternal: ["shared"],
    clean: true,
    env: {
      ...options.env,
    },
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        "process.env.IS_BUILT": '"true"',
        "process.env.NODE_ENV": isDev ? '"developpement"' : '"production"',
      }
    },
  }
})
