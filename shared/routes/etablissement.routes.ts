import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { ZEtablissement } from "../models"
import { zObjectId } from "../models/common"

import { IRoutesDef } from "./common.routes"

export const zEtablissementRoutes = {
  get: {
    "/admin/etablissements/siret-formateur/:siret": {
      method: "get",
      path: "/admin/etablissements/siret-formateur/:siret",
      params: z.object({ siret: extensions.siret() }).strict(),
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
        // "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "cookie-session",
        role: "administrator",
      },
    },
    "/admin/etablissements/:id": {
      method: "get",
      path: "/admin/etablissements/:id",
      params: z.object({ id: zObjectId }).strict(),
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
        // "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "cookie-session",
        role: "administrator",
      },
    },
    "/etablissements/:id": {
      method: "get",
      path: "/etablissements/:id",
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement.pick({
          _id: true,
          optout_refusal_date: true,
          raison_sociale: true,
          formateur_siret: true,
          formateur_address: true,
          formateur_zip_code: true,
          formateur_city: true,
          premium_affelnet_activation_date: true,
          gestionnaire_siret: true,
          premium_activation_date: true,
          premium_refusal_date: true,
        }).strict(),
      },
      // TODO SHOULD HAVE AUTH ???? Jwt at least
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  post: {
    "/etablissements/:id/premium/affelnet/accept": {
      // TODO_SECURITY_FIX ajouter un jwt
      method: "post",
      path: "/etablissements/:id/premium/affelnet/accept",
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/etablissements/:id/premium/accept": {
      method: "post",
      path: "/etablissements/:id/premium/accept",
      // TODO_SECURITY_FIX ajouter un jwt
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/etablissements/:id/premium/affelnet/refuse": {
      method: "post",
      path: "/etablissements/:id/premium/affelnet/refuse",
      // TODO_SECURITY_FIX ajouter un jwt
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/etablissements/:id/premium/refuse": {
      method: "post",
      path: "/etablissements/:id/premium/refuse",
      // TODO_SECURITY_FIX ajouter un jwt
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/etablissements/:id/opt-out/unsubscribe": {
      method: "post",
      path: "/etablissements/:id/opt-out/unsubscribe",
      // TODO_SECURITY_FIX ajouter un jwt
      params: z.object({ id: zObjectId }).strict(),
      body: z.union([z.object({ opt_out_question: z.string() }).strict(), z.object({}).strict()]),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  patch: {
    "/admin/etablissements/:id": {
      method: "patch",
      path: "/admin/etablissements/:id",
      params: z.object({ id: zObjectId }).strict(),
      body: ZEtablissement.pick({
        gestionnaire_email: true,
      }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "cookie-session",
        role: "administrator",
      },
    },
    "/etablissements/:id/appointments/:appointmentId": {
      method: "patch",
      path: "/etablissements/:id/appointments/:appointmentId",
      // TODO_SECURITY_FIX ajouter un jwt
      body: z.object({ has_been_read: z.boolean() }).strict(),
      params: z.object({ id: zObjectId, appointmentId: zObjectId }).strict(),
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
        // "2xx": ZAppointment,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
