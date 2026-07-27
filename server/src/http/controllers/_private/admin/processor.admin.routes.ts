import { getProcessorStatus } from "job-processor"
import { zRoutes } from "shared"
import type { z } from "shared/helpers/zodWithOpenApi"
import type { zTriggerableJobs } from "shared/routes/_private/admin/processor.admin.routes"

import type { Server } from "@/http/server"
import { processApplications } from "@/jobs/applications/processApplications"
import { processRecruiterIntentions } from "@/jobs/applications/processRecruiterIntentions"
import { importCatalogueFormationJob } from "@/jobs/formationsCatalogue/formationsCatalogue"
import { processJobPartnersForApi } from "@/jobs/offrePartenaire/processJobPartnersForApi"

type TriggerableJob = z.infer<typeof zTriggerableJobs>

const jobHandlers: Record<TriggerableJob, () => Promise<unknown>> = {
  processApplications,
  processRecruiterIntentions,
  processJobPartnersForApi,
  importCatalogueFormationJob,
}

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
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "10s",
        },
      },
    },
    async (request, response) => {
      const { job } = request.body as { job: TriggerableJob }
      await jobHandlers[job]()
      return response.status(200).send({})
    }
  )
}
