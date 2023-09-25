import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { zEtablissementCatalogue } from "../interface/etablissement.types"
import { ZRecruiter } from "../models"
import { zCFA } from "../models/cfa.model"
import { zObjectId } from "../models/common"
import { zEntreprise } from "../models/entreprise.model"
import { ZLbarError } from "../models/lbacError.model"
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
    "/api/etablissement/cfa/rome": {
      querystring: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
          rome: z.array(z.string()),
        })
        .strict(),
      response: {
        "2xx": zEtablissementCatalogue
          .pick({
            _id: true,
            numero_voie: true,
            type_voie: true,
            nom_voie: true,
            nom_departement: true,
            entreprise_raison_sociale: true,
            geo_coordonnees: true,
          })
          .extend({
            distance_en_km: z.string(),
          })
          .strict(),
      },
    },
    "/api/etablissement/entreprise/:siret": {
      params: z.object({
        siret: extensions.siret(),
      }),
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
    },
    "/api/etablissement/entreprise/:siret/opco": {
      params: z.object({ siret: extensions.siret() }),
      response: {
        "2xx": z
          .object({
            opco: z.string(),
            idcc: z.string(),
          })
          .strict(),
      },
    },
    "/api/etablissement/cfa/:siret": {
      params: z.object({ siret: extensions.siret() }),
      response: {
        "2xx": z
          .object({
            establishment_state: z.string(),
            is_qualiopi: z.string(),
            establishment_siret: z.string(),
            establishment_raison_sociale: z.string(),
            contacts: z.string(),
            address_detail: z.string(),
            address: z.string(),
            geo_coordinates: z.string(),
          })
          .strict(),
      },
    },
  },
  post: {
    "/api/etablissement/creation": {
      body: z.union([zCFA.extend(zShalowUser.shape), zEntreprise.extend(zShalowUser.shape)]),
      response: {
        "2xx": z.union([
          ZLbarError,
          z.object({
            formulaire: ZRecruiter,
            user: ZUserRecruteur,
          }),
        ]),
      },
    },
    "/api/etablissement/:establishment_siret/proposition/unsubscribe": {
      params: z.object({ establishment_siret: extensions.siret() }),
      response: {
        "2xx": z
          .object({
            ok: z.literal(true),
          })
          .strict(),
      },
    },
    "/api/etablissement/validation": {
      body: z.object({ id: zObjectId }),
      response: {
        "2xx": z.object({ token: z.string() }).strict(), // JWToken
      },
    },
  },
  put: {
    "/api/etablissement/:id": {
      params: z.object({ id: zObjectId }),
      body: ZUserRecruteur,
      response: {
        "2xx": ZUserRecruteur,
      },
      securityScheme: {
        auth: "jwt-bearer",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
