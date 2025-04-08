import { z } from "zod"
import { zObjectId } from "zod-mongodb-schema"

import { ZGeometry, ZPointGeometry } from "../address.model.js"
import { IModelDescriptor } from "../common.js"

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
    [{ codesPostaux: 1 }, {}],
    [{ centre: "2dsphere" }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
