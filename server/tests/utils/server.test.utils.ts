import { beforeAll } from "vitest"

import { bindFastifyServer, Server } from "@/http/server"

export const useServer = () => {
  let app: Server

  beforeAll(async () => {
    app = await bindFastifyServer()
  })

  return () => app
}
