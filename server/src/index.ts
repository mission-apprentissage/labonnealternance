import "dotenv/config"
import createComponents from "./common/components/components"
import { logger } from "./common/logger"
import server from "./http/server"

process.on("unhandledRejection", (e) => logger.error(e, "An unexpected error occurred"))
process.on("uncaughtException", (e) => logger.error(e, "An unexpected error occurred"))
;(async function () {
  const components = await createComponents() // using older version with mongoose

  const http = await server(components)
  http.listen(5000, () => logger.info(`Server ready and listening on port ${5000}`))
})()
