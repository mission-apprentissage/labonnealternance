import { executeMongoDb } from "./mongoPlugin"

export function setupNodeEvents(on, config) {
  const envReader = {
    env(key: string) {
      return config?.resolved?.env?.[key]?.value
    },
  }

  on("task", {
    executeMongoDb: executeMongoDb(envReader),
  })
}
