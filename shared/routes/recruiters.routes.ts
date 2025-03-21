import { Jsonify } from "type-fest"
import { zObjectId } from "zod-mongodb-schema"

import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { ZEtablissementCatalogueProcheWithDistance } from "../interface/etablissement.types.js"
import { ZPointGeometry } from "../models/address.model.js"
import { zCFA } from "../models/cfa.model.js"
import { ZEntreprise } from "../models/entreprise.model.js"
import { ZRecruiter } from "../models/recruiter.model.js"
import { ZUserRecruteurPublic, ZUserRecruteurWritable } from "../models/usersRecruteur.model.js"
import { ZUserWithAccount } from "../models/userWithAccount.model.js"

import { IRoutesDef } from "./common.routes.js"

export const ZEntrepriseInformations = z
  .object({
    establishment_enseigne: z.string().nullish(),
    establishment_state: z.string(), // F pour fermé ou A pour actif
    establishment_siret: z.string().nullish(),
    establishment_raison_sociale: z.string().nullish(),
    address_detail: z.any(),
    address: z.string().nullish(),
    contacts: z.array(z.any()), // conserve la coherence avec l'UI
    naf_code: z.string().nullish(),
    naf_label: z.string().nullish(),
    establishment_size: z.string().nullish(),
    establishment_creation_date: z.date().nullish(),
    geo_coordinates: z.string().nullish(),
    geopoint: ZPointGeometry.nullish().describe("Coordonnées geographique de l'établissement"),
  })
  .strict()

export type IEntrepriseInformations = Jsonify<z.input<typeof ZEntrepriseInformations>>

export const zRecruiterRoutes = {
  get: {
    "/etablissement/cfas-proches": {
      method: "get",
      path: "/etablissement/cfas-proches",
      querystring: z
        .object({
          latitude: z.coerce.number(),
          longitude: z.coerce.number(),
          rome: z.string(),
          limit: z.coerce.number(),
        })
        .strict(),
      response: {
        "200": z.array(ZEtablissementCatalogueProcheWithDistance),
      },
      securityScheme: null,
    },
    "/etablissement/entreprise/:siret": {
      method: "get",
      path: "/etablissement/entreprise/:siret",
      // TODO_SECURITY_FIX réduire les paramètres de réponse remontant à l'ui
      params: z
        .object({
          siret: extensions.siret,
        })
        .strict(),
      querystring: z
        .object({
          cfa_delegated_siret: z.string().optional(),
          skipUpdate: z.string().optional(),
        })
        .strict(),
      response: {
        "200": ZEntreprise,
      },
      securityScheme: null,
    },
    "/etablissement/entreprise/:siret/opco": {
      method: "get",
      path: "/etablissement/entreprise/:siret/opco",
      params: z.object({ siret: extensions.siret }).strict(),
      response: {
        "200": z
          .object({
            opco: z.string(),
            idcc: z.number().nullable(),
          })
          .strict(),
      },
      securityScheme: null,
    },
    "/etablissement/cfa/:siret/validate-creation": {
      method: "get",
      path: "/etablissement/cfa/:siret/validate-creation",
      params: z.object({ siret: extensions.siret }).strict(),
      response: {
        "200": z.object({}),
      },
      securityScheme: null,
    },
    "/etablissement/cfa/:siret": {
      method: "get",
      path: "/etablissement/cfa/:siret",
      // TODO_SECURITY_FIX réduire les paramètres de réponse remontant à l'ui
      // TODO_SECURITY_FIX faire en sorte que le back refasse l'appel
      params: z.object({ siret: extensions.siret }).strict(),
      response: {
        "200": zCFA.pick({
          address: true,
          address_detail: true,
          geo_coordinates: true,
          raison_sociale: true,
          enseigne: true,
          siret: true,
        }),
      },
      securityScheme: null,
    },
    "/etablissement/cfa/:cfaId/entreprises": {
      method: "get",
      path: "/etablissement/cfa/:cfaId/entreprises",
      params: z.object({ cfaId: zObjectId }).strict(),
      response: {
        "200": z.array(ZRecruiter),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "user:manage",
        resources: {
          user: [{ _id: { type: "params", key: "cfaId" } }],
        },
      },
    },
  },
  post: {
    "/etablissement/creation": {
      method: "post",
      path: "/etablissement/creation",
      body: z.union([
        z
          .object({
            type: z.literal("CFA"),
          })
          .strict()
          .extend(
            ZUserRecruteurWritable.pick({
              last_name: true,
              first_name: true,
              phone: true,
              email: true,
              origin: true,
              establishment_siret: true,
              opco: true,
            }).shape
          ),
        z
          .object({
            type: z.literal("ENTREPRISE"),
            opco: z.string(),
            idcc: z.string().optional(),
          })
          .strict()
          .extend(
            ZUserRecruteurWritable.pick({
              last_name: true,
              first_name: true,
              phone: true,
              email: true,
              origin: true,
              establishment_siret: true,
            }).shape
          ),
      ]),
      response: {
        "200": z
          .object({
            formulaire: ZRecruiter.optional(),
            user: ZUserWithAccount,
            token: z.string(),
            validated: z.boolean(),
          })
          .strict(),
      },
      securityScheme: null,
    },
    "/etablissement/:establishment_siret/proposition/unsubscribe": {
      method: "post",
      path: "/etablissement/:establishment_siret/proposition/unsubscribe",
      params: z.object({ establishment_siret: extensions.siret }).strict(),
      response: {
        "2xx": z
          .object({
            ok: z.literal(true),
          })
          .strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/etablissement/validation": {
      method: "post",
      path: "/etablissement/validation",
      response: {
        "200": ZUserRecruteurPublic,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
