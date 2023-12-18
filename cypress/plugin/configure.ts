import { executeMongoDb } from "./mongoPlugin"

export function setupNodeEvents(on) {
  on("task", {
    executeMongoDb,
  })
}
