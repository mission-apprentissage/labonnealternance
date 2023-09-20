import mongoose from "mongoose"
import request from "supertest"
import { beforeAll } from "vitest"

import server from "@/http/server"

export const useServer = () => {
  let app

  beforeAll(async () => {
    app = await server({ db: mongoose.connection })
  })

  return () => request(app)
}
