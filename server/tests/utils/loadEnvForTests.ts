import { config } from "dotenv"

export function loadEnvForTests() {
  config({
    path: ["./server/.env.test", "./server/.env.test.local"],
    override: true,
  })
}
