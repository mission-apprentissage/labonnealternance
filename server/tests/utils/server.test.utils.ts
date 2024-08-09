import { beforeAll } from "vitest"

import server, { Server } from "@/http/server"

export const useServer = () => {
  let app: Server

  beforeAll(async () => {
    app = await server()
  })

  return () => app
}
