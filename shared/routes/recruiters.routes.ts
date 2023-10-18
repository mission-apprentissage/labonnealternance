import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { ZRecruiter } from "../models"
import { zObjectId } from "../models/common"
import { ZUserRecruteur, ZUserRecruteurWritable, zReferentielData } from "../models/usersRecruteur.model"

import { IRoutesDef } from "./common.routes"

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
      securityScheme: null,
    },
    "/etablissement/entreprise/:siret/opco": {
      method: "get",
      path: "/etablissement/entreprise/:siret/opco",
      params: z.object({ siret: extensions.siret }).strict(),
      response: {
        "2xx": z
          .object({
            opco: z.string(),
            idcc: z.string().nullish(),
          })
          .strict(),
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
        "2xx": zReferentielData,
      },
      securityScheme: null,
    },
    "/etablissement/cfa/:userRecruteurId/entreprises": {
      method: "get",
      path: "/etablissement/cfa/:userRecruteurId/entreprises",
      params: z.object({ userRecruteurId: zObjectId }).strict(),
      response: {
        "200": z.array(ZRecruiter),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "user:manage",
        ressources: {
          user: [{ _id: { type: "params", key: "userRecruteurId" } }],
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
            }).shape
          ),
        z
          .object({
            type: z.literal("ENTREPRISE"),
            opco: z.string(),
            idcc: z.string().optional(),
          })
          .strict()
          .extend({
            cfa_delegated_siret: ZRecruiter.shape.cfa_delegated_siret,
          })
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
      securityScheme: null,
    },
    "/etablissement/:establishment_siret/proposition/unsubscribe": {
      method: "post",
      path: "/etablissement/:establishment_siret/proposition/unsubscribe",
      // TODO_SECURITY_FIX jwt
      params: z.object({ establishment_siret: extensions.siret }).strict(),
      response: {
        "2xx": z
          .object({
            ok: z.literal(true),
          })
          .strict(),
      },
      securityScheme: null,
    },
    "/etablissement/validation": {
      method: "post",
      path: "/etablissement/validation",
      querystring: z.object({ token: z.string() }).strict(),
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
        // "2xx": z.union([z.object({ token: z.string() }).strict(), z.object({ isUserAwaiting: z.boolean() }).strict()]),
      },
      securityScheme: {
        auth: "jwt-token",
        access: null,
        ressources: {},
      },
    },
  },
  put: {
    "/etablissement/:id": {
      method: "put",
      path: "/etablissement/:id",
      // TODO_SECURITY_FIX jwt en mode session + filtre sur la payload pour réduction
      params: z.object({ id: zObjectId }).strict(),
      body: ZUserRecruteurWritable.pick({
        last_name: true,
        first_name: true,
        phone: true,
        email: true,
        is_email_checked: true,
        last_connection: true,
      }).partial(),
      response: {
        "2xx": z.union([ZUserRecruteur, z.null()]),
      },
      securityScheme: {
        auth: "cookie-session",
        access: null,
        ressources: {
          user: [{ _id: { type: "params", key: "id" } }],
        },
      },
    },
  },
} as const satisfies IRoutesDef
