export function setupNodeEvents(on, _config) {
  // const envReader = {
  //   env(key: string) {
  //     return config?.resolved?.env?.[key]?.value
  //   },
  // }

  on("task", {
    // executeMongoDb: executeMongoDb(envReader),
  })
}
