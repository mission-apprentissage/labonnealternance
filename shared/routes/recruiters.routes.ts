import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { zEtablissementCatalogue } from "../interface/etablissement.types"
import { ZGlobalAddress } from "../models"
import { zCFA } from "../models/cfa.model"
import { zObjectId } from "../models/common"
import { ZUserRecruteur } from "../models/usersRecruteur.model"

import { IRoutesDef } from "./common.routes"

const zShalowUser = ZUserRecruteur.pick({
  type: true,
  first_name: true,
  last_name: true,
  phone: true,
  email: true,
  origin: true,
  opco: true,
})

export const zRecruiterRoutes = {
  get: {
    "/api/etablissement/cfas-proches": {
      querystring: z
        .object({
          latitude: z.coerce.number(),
          longitude: z.coerce.number(),
          rome: z.string(),
        })
        .strict(),
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
        // "2xx": zEtablissementCatalogue
        //   .pick({
        //     _id: true,
        //     numero_voie: true,
        //     type_voie: true,
        //     nom_voie: true,
        //     nom_departement: true,
        //     entreprise_raison_sociale: true,
        //     geo_coordonnees: true,
        //   })
        //   .extend({
        //     distance_en_km: z.string(),
        //   })
        //   .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/etablissement/entreprise/:siret": {
      // TODO_SECURITY_FIX réduire les paramètres de réponse remontant à l'ui
      params: z
        .object({
          siret: extensions.siret(),
        })
        .strict(),
      querystring: z
        .object({
          cfa_delegated_siret: z.string().optional(),
        })
        .strict(),
      response: {
        "2xx": z
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
            geo_coordinates: z.string(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/etablissement/entreprise/:siret/opco": {
      params: z.object({ siret: extensions.siret() }).strict(),
      response: {
        "2xx": z
          .object({
            opco: z.string(),
            idcc: z.string().nullish(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/etablissement/cfa/:siret": {
      // TODO_SECURITY_FIX réduire les paramètres de réponse remontant à l'ui
      // TODO_SECURITY_FIX faire en sorte que le back refasse l'appel
      params: z.object({ siret: extensions.siret() }).strict(),
      response: {
        "2xx": z
          .object({
            establishment_state: z.string(),
            is_qualiopi: z.boolean(),
            establishment_siret: z.string(),
            establishment_raison_sociale: z.string(),
            contacts: z.array(
              z
                .object({
                  email: z.string(),
                  confirmé: z.boolean(),
                  sources: z.array(z.string()),
                  date_collecte: z.date(),
                })
                .strict()
            ),
            address_detail: ZGlobalAddress,
            address: z.string(),
            geo_coordinates: z.string().nullish(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  post: {
    "/api/etablissement/creation": {
      body: z.union([
        zCFA.extend(zShalowUser.shape).extend({
          type: z.literal("CFA"),
        }),
        z
          .object({
            type: z.literal("ENTREPRISE"),
            establishment_siret: z.string(),
            opco: z.string(),
            idcc: z.string().optional(),
          })
          .strict()
          .extend(
            ZUserRecruteur.pick({
              type: true,
              siret: true,
              last_name: true,
              first_name: true,
              phone: true,
              email: true,
              cfa_delegated_siret: true,
              origin: true,
            }).shape
          ),
      ]),
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
        // "2xx": z.union([
        //   z
        //     .object({
        //       formulaire: ZRecruiter,
        //       user: ZUserRecruteur.extend({
        //         type: z.literal("ENTREPRISE"),
        //       }),
        //     })
        //     .strict(),
        //   z
        //     .object({
        //       user: ZUserRecruteur,
        //     })
        //     .strict(),
        // ]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/etablissement/:establishment_siret/proposition/unsubscribe": {
      // TODO_SECURITY_FIX jwt
      params: z.object({ establishment_siret: extensions.siret() }).strict(),
      response: {
        "2xx": z
          .object({
            ok: z.literal(true),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/etablissement/validation": {
      // TODO_SECURITY_FIX jwt
      body: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": z.union([z.object({ token: z.string() }).strict(), z.object({ isUserAwaiting: z.boolean() }).strict()]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  put: {
    "/api/etablissement/:id": {
      // TODO_SECURITY_FIX jwt en mode session + filtre sur la payload pour réduction
      params: z.object({ id: zObjectId }).strict(),
      body: ZUserRecruteur,
      response: {
        "2xx": z.union([ZUserRecruteur, z.null()]),
      },
      securityScheme: {
        auth: "jwt-bearer",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
