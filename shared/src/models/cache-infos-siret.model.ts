import { EDiffusibleStatus } from "../constants/diffusible-status.js"
import { BusinessErrorCodes } from "../constants/error-codes.js"
import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"

import { ZAdresseV3 } from "./address.model.js"
import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

// cf documentation https://entreprise.api.gouv.fr/developpeurs/openapi#tag/Informations-generales/paths/~1v3~1insee~1sirene~1etablissements~1diffusibles~1%7Bsiret%7D/get
export const ZEtablissementGouvData = z.looseObject({
  data: z.looseObject({
    status_diffusion: extensions.buildEnum(EDiffusibleStatus),
    siret: extensions.siret,
    etat_administratif: z.enum(["A", "F"]).describe("A: actif, F: fermé"),
    activite_principale: z.looseObject({
      code: z.string().nullish(),
      libelle: z.string().nullish(),
    }),
    enseigne: z.string().nullish(),
    unite_legale: z.looseObject({
      tranche_effectif_salarie: z.looseObject({
        code: z.enum(["NN", "00", "01", "02", "03", "11", "12", "21", "22", "31", "32", "41", "42", "51", "52", "53"]).nullish(),
      }),
      date_creation: z.number().nullish(),
      personne_morale_attributs: z.looseObject({
        raison_sociale: z.string().nullish(),
      }),
      personne_physique_attributs: z.looseObject({
        prenom_usuel: z.string().nullish(),
        nom_naissance: z.string().nullish(),
        nom_usage: z.string().nullish(),
      }),
    }),
    adresse: ZAdresseV3,
  }),
})

export type IEtablissementGouvData = z.output<typeof ZEtablissementGouvData>

export const ZCacheInfosSiret = z.strictObject({
  _id: zObjectId,
  createdAt: z.date(),
  updatedAt: z.date(),
  siret: extensions.siret,
  error: z.enum([BusinessErrorCodes.NON_DIFFUSIBLE]).nullish(),
  data: ZEtablissementGouvData.nullish(),
})

export type ICacheInfosSiret = z.output<typeof ZCacheInfosSiret>

export default {
  zod: ZCacheInfosSiret,
  indexes: [[{ siret: 1 }, { unique: true }]],
  collectionName: "cache_siret" as const,
} as const satisfies IModelDescriptor
