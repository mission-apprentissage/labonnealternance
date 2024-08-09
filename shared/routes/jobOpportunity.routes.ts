import { NIVEAUX_POUR_LBA, OPCOS } from "../constants/recruteur"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

const romes = extensions.romeCodeArray()
const rncp = extensions.rncpCode()
const insee = extensions.inseeCode().nullish()

const ZJobOpportunityQuerystringBase = z.object({
  latitude: extensions.latitude(),
  longitude: extensions.longitude(),
  radius: z.number().min(0).max(200).default(30),
  diploma: extensions.buildEnum(NIVEAUX_POUR_LBA).default(NIVEAUX_POUR_LBA.INDIFFERENT),
  opco: extensions.buildEnum(OPCOS).optional(),
  opcoUrl: z.string().optional(),
})

export const ZJobOpportunityRome = ZJobOpportunityQuerystringBase.extend({ romes, insee })
export const ZJobOpportunityRncp = ZJobOpportunityQuerystringBase.extend({ rncp, insee })
export type IJobOpportunityRome = z.output<typeof ZJobOpportunityRome>
export type IJobOpportunityRncp = z.output<typeof ZJobOpportunityRncp>
