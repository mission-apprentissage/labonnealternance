import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { ZAppointment, ZEtablissement } from "../models"
import { zObjectId } from "../models/common"

import { IRoutesDef } from "./common.routes"

export const zEtablissementRoutes = {
  get: {
    "/admin/etablissements/siret-formateur/:siret": {
      method: "get",
      path: "/admin/etablissements/siret-formateur/:siret",
      params: z.object({ siret: extensions.siret }).strict(),
      response: {
        "200": ZEtablissement.strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {
          eligibleTrainingsForAppointment: [
            {
              etablissement_formateur_siret: { type: "params", key: "siret" },
            },
          ],
        },
      },
    },
    "/admin/etablissements/:id": {
      method: "get",
      path: "/admin/etablissements/:id",
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "200": ZEtablissement.strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {
          etablissement: [
            {
              _id: { type: "params", key: "id" },
            },
          ],
        },
      },
    },
    "/etablissements/:id": {
      method: "get",
      path: "/etablissements/:id",
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "200": ZEtablissement.pick({
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
      securityScheme: {
        auth: "access-token",
        access: null,
        ressources: {},
      },
    },
  },
  post: {
    "/etablissements/:id/premium/affelnet/accept": {
      method: "post",
      path: "/etablissements/:id/premium/affelnet/accept",
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "200": ZEtablissement,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        ressources: {},
      },
    },
    "/etablissements/:id/premium/affelnet/refuse": {
      method: "post",
      path: "/etablissements/:id/premium/affelnet/refuse",
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "200": ZEtablissement,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        ressources: {},
      },
    },
    "/etablissements/:id/premium/accept": {
      method: "post",
      path: "/etablissements/:id/premium/accept",
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "200": ZEtablissement,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        ressources: {},
      },
    },
    "/etablissements/:id/premium/refuse": {
      method: "post",
      path: "/etablissements/:id/premium/refuse",
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "200": ZEtablissement,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        ressources: {},
      },
    },
    "/etablissements/:id/opt-out/unsubscribe": {
      method: "post",
      path: "/etablissements/:id/opt-out/unsubscribe",
      // TODO_SECURITY_FIX ajouter un jwt
      params: z.object({ id: zObjectId }).strict(),
      body: z.union([z.object({ opt_out_question: z.string() }).strict(), z.object({}).strict()]),
      response: {
        "200": ZEtablissement,
      },
      securityScheme: null,
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
        "200": ZEtablissement,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {
          etablissement: [
            {
              _id: { type: "params", key: "id" },
            },
          ],
        },
      },
    },
    "/etablissements/:id/appointments/:appointmentId": {
      method: "patch",
      path: "/etablissements/:id/appointments/:appointmentId",
      body: z.object({ has_been_read: z.boolean() }).strict(),
      params: z.object({ id: zObjectId, appointmentId: zObjectId }).strict(),
      response: {
        "200": ZAppointment,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        ressources: {},
      },
    },
  },
} as const satisfies IRoutesDef
