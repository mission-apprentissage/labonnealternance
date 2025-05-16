import { zProcessorStatus } from "job-processor/dist/core.js"

import { IRoutesDef } from "../../common.routes.js"

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
  post: {},
} as const satisfies IRoutesDef
