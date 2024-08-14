import { BusinessErrorCodes } from "../constants/errorCodes"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { ZAdresseV3 } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"

export const ZEtablissementGouvData = z
  .object({
    data: z
      .object({
        siret: extensions.siret,
        etat_administratif: z.enum(["A", "F"]).describe("A: actif, F: fermé"),
        activite_principale: z
          .object({
            code: z.string().nullish(),
            libelle: z.string().nullish(),
          })
          .passthrough(),
        enseigne: z.string().nullish(),
        unite_legale: z
          .object({
            tranche_effectif_salarie: z
              .object({
                code: z.enum(["NN", "00", "01", "02", "03", "11", "12", "21", "22", "31", "32", "41", "42", "51", "52", "53"]).nullish(),
              })
              .passthrough(),
            date_creation: z.number().nullish(),
            personne_morale_attributs: z
              .object({
                raison_sociale: z.string().nullish(),
              })
              .passthrough(),
            personne_physique_attributs: z
              .object({
                prenom_usuel: z.string().nullish(),
                nom_naissance: z.string().nullish(),
                nom_usage: z.string().nullish(),
              })
              .passthrough(),
          })
          .passthrough(),
        adresse: ZAdresseV3,
      })
      .passthrough(),
  })
  .passthrough()

export type IEtablissementGouvData = z.output<typeof ZEtablissementGouvData>

export const ZCacheInfosSiret = z
  .object({
    _id: zObjectId,
    createdAt: z.date(),
    updatedAt: z.date(),
    siret: extensions.siret,
    error: z.enum([BusinessErrorCodes.NON_DIFFUSIBLE]).nullish(),
    data: ZEtablissementGouvData.nullish(),
  })
  .strict()

export type ICacheInfosSiret = z.output<typeof ZCacheInfosSiret>

export default {
  zod: ZCacheInfosSiret,
  indexes: [[{ siret: 1 }, { unique: true }]],
  collectionName: "cache_siret" as const,
} as const satisfies IModelDescriptor
