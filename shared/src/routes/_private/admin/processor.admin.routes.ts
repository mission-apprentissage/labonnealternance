import { zProcessorStatus } from "job-processor/dist/core.js"
import { z } from "zod"
import type { IRoutesDef } from "../../common.routes.js"

export const zTriggerableJobs = z.enum(["processApplications", "processRecruiterIntentions", "processJobPartnersForApi", "importCatalogueFormationJob"])

export const zProcessorAdminRoutes = {
  get: {
    "/_private/admin/processor": {
      method: "get",
      path: "/_private/admin/processor",
      response: { "200": zProcessorStatus },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
  post: {
    "/_private/admin/processor/trigger": {
      method: "post",
      path: "/_private/admin/processor/trigger",
      body: z.strictObject({ job: zTriggerableJobs }),
      response: { "200": z.strictObject({}) },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
