import { config } from "dotenv"

const ENV_FILES = ["./server/.env.test", "./server/.env.test.local"]

export function loadEnvForTests() {
  config({
    path: ENV_FILES,
    override: true,
  })
}

// Même résolution que loadEnvForTests, sans modifier process.env.
export function readEnvForTests(): Record<string, string | undefined> {
  const fromFiles: Record<string, string> = {}
  config({ path: ENV_FILES, override: true, processEnv: fromFiles })
  return { ...process.env, ...fromFiles }
}
