import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { zEtablissementCatalogue } from "../interface/etablissement.types"
import { zObjectId } from "../models/common"

export const zRecruiterRoutes = {
  get: {
    "/cfa/rome": {
      querystring: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
          rome: z.array(z.string()),
        })
        .strict()
        .required(),
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
          }),
      },
    },
    "/entreprise/:siret": {
      params: z.object({ siret: extensions.siret() }),
      response: {
        "2xx": z.object({
          establishment_enseigne: z.string(),
          establishment_state: z.string(), // F pour fermé ou A pour actif
          establishment_siret: z.string(),
          establishment_raison_sociale: z.string(),
          address_detail: z.any(),
          address: z.string(),
          contacts: z.array(z.any()), // conserve la coherence avec l'UI
          naf_code: z.number(),
          naf_label: z.string(),
          establishment_size: z.string(),
          establishment_creation_date: z.date(),
          geo_coordinates: z.string(),
        }),
      },
    },
    "/entreprise/:siret/opco": {
      params: z.object({ siret: extensions.siret() }),
      response: {
        "2xx": z.object({
          opco: z.string(),
          idcc: z.string(),
        }),
      },
    },
    "/cfa/:siret": {
      params: z.object({ siret: extensions.siret() }),
      response: {
        "2xx": z.object({
          establishment_state: z.string(),
          is_qualiopi: z.string(),
          establishment_siret: z.string(),
          establishment_raison_sociale: z.string(),
          contacts: z.string(),
          address_detail: z.string(),
          address: z.string(),
          geo_coordinates: z.string(),
        }),
      },
    },
  },
  post: {
    "/creation": {},
    "/:establishment_siret/proposition/unsubscribe": {
      params: z.object({ establishment_siret: extensions.siret() }),
      response: {
        "2xx": {
          ok: true,
        },
      },
    },
    "/validation": {
      body: z.object({ id: zObjectId }),
      response: {}, // JWToken
    },
  },
  put: {
    "/:id": {
      params: z.object({ id: zObjectId }),
      body: {},
      response: {
        "2xx": {},
      },
    },
  },
  delete: {},
}
