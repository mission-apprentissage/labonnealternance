import request from "supertest"
import { beforeAll } from "vitest"

import server from "@/http/server"

export const useServer = () => {
  let app

  beforeAll(async () => {
    app = await server()
  })

  return () => request(app)
}
