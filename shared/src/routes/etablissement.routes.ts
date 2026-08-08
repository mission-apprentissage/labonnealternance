import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { zObjectId } from "../models/common.js"
import { ZEtablissement } from "../models/etablissement.model.js"

import type { IRoutesDef } from "./common.routes.js"

export const zEtablissementRoutes = {
  get: {
    "/admin/etablissements/siret-formateur/:siret": {
      method: "get",
      path: "/admin/etablissements/siret-formateur/:siret",
      params: z.strictObject({ siret: extensions.siret }),
      response: {
        "200": ZEtablissement.strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/admin/etablissements/:id": {
      method: "get",
      path: "/admin/etablissements/:id",
      params: z.strictObject({ id: zObjectId }),
      response: {
        "200": ZEtablissement.strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/etablissements/:id": {
      method: "get",
      path: "/etablissements/:id",
      params: z.strictObject({ id: zObjectId }),
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
          premium_affelnet_refusal_date: true,
          gestionnaire_siret: true,
          premium_activation_date: true,
          premium_refusal_date: true,
        }).strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
  post: {
    "/etablissements/:id/premium/affelnet/accept": {
      method: "post",
      path: "/etablissements/:id/premium/affelnet/accept",
      params: z.strictObject({ id: zObjectId }),
      response: {
        "200": ZEtablissement,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/etablissements/:id/premium/affelnet/refuse": {
      method: "post",
      path: "/etablissements/:id/premium/affelnet/refuse",
      params: z.strictObject({ id: zObjectId }),
      response: {
        "200": ZEtablissement,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/etablissements/:id/premium/accept": {
      method: "post",
      path: "/etablissements/:id/premium/accept",
      params: z.strictObject({ id: zObjectId }),
      response: {
        "200": ZEtablissement,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/etablissements/:id/premium/refuse": {
      method: "post",
      path: "/etablissements/:id/premium/refuse",
      params: z.strictObject({ id: zObjectId }),
      response: {
        "200": ZEtablissement,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/etablissements/:id/opt-out/unsubscribe": {
      method: "post",
      path: "/etablissements/:id/opt-out/unsubscribe",
      params: z.strictObject({ id: zObjectId }),
      body: z.union([z.strictObject({ opt_out_question: z.string() }), z.strictObject({})]),
      response: {
        "200": ZEtablissement,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
  patch: {
    "/admin/etablissements/:id": {
      method: "patch",
      path: "/admin/etablissements/:id",
      params: z.strictObject({ id: zObjectId }),
      body: ZEtablissement.pick({
        gestionnaire_email: true,
      }).strict(),
      response: {
        "200": ZEtablissement,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
