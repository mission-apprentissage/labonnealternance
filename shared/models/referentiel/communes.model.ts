import { z } from "zod"

import { ZGeometry, ZPointGeometry } from "../address.model"
import { IModelDescriptor, zObjectId } from "../common"

const collectionName = "referentiel.communes" as const

export const zReferentielCommune = z
  .object({
    _id: zObjectId,
    code: z.string(),
    codesPostaux: z.array(z.string()),
    centre: ZPointGeometry,
    bbox: ZGeometry,
    nom: z.string(),
    codeDepartement: z.string(),
    codeRegion: z.string(),
  })
  .strict()

export type IReferentielCommune = z.output<typeof zReferentielCommune>

export const referentielCommuneModel = {
  zod: zReferentielCommune,
  indexes: [
    [{ code: 1 }, { unique: true }],
    [{ centre: "2dsphere" }, {}],
    [{ bbox: "2dsphere" }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
