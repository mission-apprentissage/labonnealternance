import { addJob, getProcessorStatus } from "job-processor"
import { zRoutes } from "shared"

import type { Server } from "@/http/server"

export function processorAdminRoutes(server: Server) {
  server.get(
    "/_private/admin/processor",
    {
      schema: zRoutes.get["/_private/admin/processor"],
      onRequest: [server.auth(zRoutes.get["/_private/admin/processor"])],
    },
    async (_request, response) => {
      return response.status(200).send(await getProcessorStatus())
    }
  )

  server.post(
    "/_private/admin/processor/trigger",
    {
      schema: zRoutes.post["/_private/admin/processor/trigger"],
      onRequest: [server.auth(zRoutes.post["/_private/admin/processor/trigger"])],
    },
    async (request, response) => {
      const { job } = request.body as { job: string }
      await addJob({ name: job, queued: true, payload: {} })
      return response.status(200).send({})
    }
  )
}
