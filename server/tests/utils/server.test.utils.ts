import { beforeAll } from "vitest"

import type { Server } from "@/http/server"
import { bindFastifyServer } from "@/http/server"

export const useServer = () => {
  let app: Server

  beforeAll(async () => {
    app = await bindFastifyServer()
  })

  return () => app
}
