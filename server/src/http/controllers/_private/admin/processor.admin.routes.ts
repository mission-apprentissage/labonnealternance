import type { FastifySerializerCompiler } from "fastify"
import { getProcessorStatus } from "job-processor"
import { zRoutes } from "shared"
import type { z } from "shared/helpers/zod-with-open-api"
import type { zTriggerableJobs } from "shared/routes/_private/admin/processor.admin.routes"

import type { Server } from "@/http/server"
import { processApplications } from "@/jobs/applications/process-applications"
import { processRecruiterIntentions } from "@/jobs/applications/process-recruiter-intentions"
import { updateHandiEngagement } from "@/jobs/engagement-handicap/update-handi-engagement"
import { importCatalogueFormationJob } from "@/jobs/formations-catalogue/formations-catalogue"
import { processJobPartnersForApi } from "@/jobs/offre-partenaire/process-job-partners-for-api"

type TriggerableJob = z.infer<typeof zTriggerableJobs>

const jobHandlers: Record<TriggerableJob, () => Promise<unknown>> = {
  processApplications,
  processRecruiterIntentions,
  processJobPartnersForApi,
  importCatalogueFormationJob,
  // Déclenchement manuel : ignore le garde-fou de marge ±20% (MISSING_SIRETS_CLEANUP_MARGIN_RATIO)
  updateHandiEngagementForce: () => updateHandiEngagement({ force: true }),
}

// zProcessorStatus (exporté par job-processor) est construit avec zod/v4-mini et utilise zObjectIdMini
// (zod-mongodb-schema), un .transform() à sens unique (string|ObjectId -> ObjectId) sans direction
// d'encodage — même défaut que celui documenté et corrigé sur zObjectId dans shared/models/common.ts,
// mais côté job-processor (dépendance externe, déjà à sa dernière version publiée). Le serializerCompiler
// par défaut de fastify-type-provider-zod encode la réponse via ce schéma : dès qu'un job/worker/
// historique réel (donc un ObjectId) est présent, il lève ZodEncodeError. Sérialiseur JSON natif pour
// cette seule route : getProcessorStatus() est déjà typée et correcte, seule l'étape d'encode zod
// (inutile ici) est court-circuitée — les autres routes gardent le comportement par défaut.
const rawJsonSerializerCompiler: FastifySerializerCompiler<unknown> = () => (data) => JSON.stringify(data)

export function processorAdminRoutes(server: Server) {
  server.get(
    "/_private/admin/processor",
    {
      schema: zRoutes.get["/_private/admin/processor"],
      onRequest: [server.auth(zRoutes.get["/_private/admin/processor"])],
      serializerCompiler: rawJsonSerializerCompiler,
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
