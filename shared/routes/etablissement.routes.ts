import { z } from "zod"

import { ZAppointment } from "../models"
import { zObjectId } from "../models/common"
import { ZEtablissement } from "../models/etablissement.model"

export const zEtablissementRoutes = {
  get: {
    "/api/etablissements/:id": {
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
  },
  post: {
    "/api/etablissements/:id/premium/affelnet/accept": {
      params: z.object({ id: z.string() }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
    "/api/etablissements/:id/premium/accept": {
      params: z.object({ id: z.string() }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
    "/api/etablissements/:id/premium/affelnet/refuse": {
      params: z.object({ id: z.string() }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
    "/api/etablissements/:id/premium/refuse": {
      params: z.object({ id: z.string() }).strict(),
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
    "/api/etablissements/:id/appointments/:appointmentId": {
      body: z.object({ has_been_read: z.string() }).strict(),
      params: z.object({ id: zObjectId, appointmentId: zObjectId }).strict(),
      response: {
        "2xx": ZAppointment,
      },
    },
  },
  put: {},
  delete: {},
}
