import type { Jsonify } from "type-fest"
import { OPCOS_LABEL } from "../constants/recruteur.js"
import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"
import { ZEtablissementCatalogueProcheWithDistance } from "../interface/etablissement.types.js"
import { ZPointGeometry } from "../models/address.model.js"
import { zCFA } from "../models/cfa.model.js"
import { zObjectId } from "../models/common.js"
import { ZEntreprise } from "../models/entreprise.model.js"
import { ZEntrepriseManagedByCfa } from "../models/entreprises-managed-by-cfa.model.js"
import { ZRecruiter } from "../models/recruiter.model.js"
import { EntrepriseEngagementSources } from "../models/referentiel-engagement-entreprise.model.js"
import { ZUserWithAccount } from "../models/user-with-account.model.js"
import { ZPersonNameInput, ZUserRecruteurPublic, ZUserRecruteurWritable } from "../models/users-recruteur.model.js"
import type { IRoutesDef } from "./common.routes.js"

export const ZEntrepriseInformations = z.strictObject({
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

export type IEntrepriseInformations = Jsonify<z.input<typeof ZEntrepriseInformations>>

export const zRecruiterRoutes = {
  get: {
    "/etablissement/cfas-proches": {
      method: "get",
      path: "/etablissement/cfas-proches",
      querystring: z.strictObject({
        latitude: z.coerce.number<number>(),
        longitude: z.coerce.number<number>(),
        rome: z.string(),
        limit: z.coerce.number<number>(),
      }),
      response: {
        "200": z.array(ZEtablissementCatalogueProcheWithDistance),
      },
      securityScheme: null,
    },
    "/etablissement/entreprise/:siret": {
      method: "get",
      path: "/etablissement/entreprise/:siret",
      // TODO_SECURITY_FIX réduire les paramètres de réponse remontant à l'ui
      params: z.strictObject({
        siret: extensions.siret,
      }),
      querystring: z.strictObject({
        cfa_delegated_siret: z.string().optional(),
        skipUpdate: z.string().optional(),
      }),
      response: {
        "200": ZEntreprise.extend({
          engagementHandicapOrigin: extensions.buildEnum(EntrepriseEngagementSources).nullish(),
        }),
      },
      securityScheme: null,
    },
    "/etablissement/entreprise/:siret/opco": {
      method: "get",
      path: "/etablissement/entreprise/:siret/opco",
      params: z.strictObject({ siret: extensions.siret }),
      response: {
        "200": z.strictObject({
          opco: z.string(),
          idcc: z.number().nullable(),
        }),
      },
      securityScheme: null,
    },
    "/etablissement/cfa/:siret/validate-creation": {
      method: "get",
      path: "/etablissement/cfa/:siret/validate-creation",
      params: z.strictObject({ siret: extensions.siret }),
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
      params: z.strictObject({ siret: extensions.siret }),
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
      params: z.strictObject({ cfaId: zObjectId }),
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
    "/etablissement/cfa/:cfaId/entreprise/:establishment_id": {
      method: "get",
      path: "/etablissement/cfa/:cfaId/entreprise/:establishment_id",
      params: z.strictObject({ cfaId: z.string(), establishment_id: z.string() }),
      response: {
        "200": ZRecruiter,
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
          .strictObject({
            type: z.literal("CFA"),
          })
          .extend({
            last_name: ZPersonNameInput,
            first_name: ZPersonNameInput,
            ...ZUserRecruteurWritable.pick({
              phone: true,
              email: true,
              origin: true,
              establishment_siret: true,
              opco: true,
            }).shape,
          }),
        z
          .strictObject({
            type: z.literal("ENTREPRISE"),
            opco: z.string(),
            idcc: z.string().optional(),
          })
          .extend({
            last_name: ZPersonNameInput,
            first_name: ZPersonNameInput,
            ...ZUserRecruteurWritable.pick({
              phone: true,
              email: true,
              origin: true,
              establishment_siret: true,
            }).shape,
          }),
      ]),
      response: {
        "200": z.strictObject({
          formulaire: z
            .object({
              opco: extensions.buildEnum(OPCOS_LABEL),
              establishment_id: z.string(),
            })
            .optional(),
          user: ZUserWithAccount,
          token: z.string(),
          validated: z.boolean(),
        }),
      },
      securityScheme: null,
    },
    "/etablissement/:establishment_siret/proposition/unsubscribe": {
      method: "post",
      path: "/etablissement/:establishment_siret/proposition/unsubscribe",
      params: z.strictObject({ establishment_siret: extensions.siret }),
      response: {
        "2xx": z.strictObject({
          ok: z.literal(true),
        }),
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
