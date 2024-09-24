import dayjs from "dayjs"
import { getProcessorHealthcheck } from "job-processor"
import { zRoutes } from "shared"

import { Server } from "../server"

export const jobProcessorController = (app: Server) => {
  app.get("/processor/healthcheck", { schema: zRoutes.get["/processor/healthcheck"] }, async (_request, response) => {
    const health = await getProcessorHealthcheck()
    const { workers } = health
    const startedAtOpt = workers.at(0)?.task?.started_at
    const isInError = !workers.length || (startedAtOpt && dayjs(startedAtOpt).isBefore(dayjs().subtract(6, "hour")))
    const status = isInError ? "error" : "ok"
    response.status(isInError ? 500 : 200).send({ ...health, status })
  })
}
