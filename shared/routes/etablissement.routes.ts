import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { ZAppointment, ZEtablissement } from "../models"
import { zObjectId } from "../models/common"

import { IRoutesDef } from "./common.routes"

export const zEtablissementRoutes = {
  get: {
    "/api/admin/etablissements/": {
      querystring: z.object({ query: z.string(), limit: z.number(), page: z.number() }).strict(),
      response: {
        "2xx": z
          .object({
            etablissements: z.array(ZEtablissement),
            pagination: z.object({
              page: z.number(),
              resultats_par_page: z.number(),
              nombre_de_page: z.number(),
              total: z.number(),
            }),
          })
          .strict(),
      },
    },
    "/api/admin/etablissements/siret-formateur/:siret": {
      params: z.object({ siret: extensions.siret() }),
      response: {
        "2xx": ZEtablissement,
      },
    },
    "/api/admin/etablissements/:id": {
      params: z.object({ id: zObjectId }),
      response: {
        "2xx": ZEtablissement,
      },
    },
    "/api/etablissements/:id": {
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
  },
  post: {
    "/api/admin/etablissements/": {
      body: ZEtablissement,
      response: {
        "2xx": ZEtablissement,
      },
    },
    "/api/etablissements/:id/premium/affelnet/accept": {
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
    "/api/etablissements/:id/premium/accept": {
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
    "/api/etablissements/:id/premium/affelnet/refuse": {
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
    "/api/etablissements/:id/premium/refuse": {
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
    "/api/etablissements/:id/opt-out/unsubscribe": {
      params: z.object({ id: zObjectId }).strict(),
      body: z.object({ opt_out_question: z.string() }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
  },
  patch: {
    "/api/admin/etablissements/:id": {
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
    "/api/etablissements/:id/appointments/:appointmentId": {
      body: z.object({ has_been_read: z.string() }).strict(),
      params: z.object({ id: zObjectId, appointmentId: zObjectId }).strict(),
      response: {
        "2xx": ZAppointment,
      },
    },
  },
} as const satisfies IRoutesDef
