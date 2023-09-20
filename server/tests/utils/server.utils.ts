import server from "@/http/server"
import mongoose from "mongoose"
import { beforeAll } from "vitest"
import request from "supertest"

export const useServer = () => {
  let app

  beforeAll(async () => {
    app = await server({ db: mongoose.connection })
  })

  return () => request(app)
}
