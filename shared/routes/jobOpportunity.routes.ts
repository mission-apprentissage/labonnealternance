import { NIVEAUX_POUR_LBA, OPCOS } from "../constants/recruteur"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

const romes = z.array(extensions.romeCode())
const rncp = extensions.rncpCode()
const insee = extensions.inseeCode()

const ZJobOpportunityQuerystringBase = z.object({
  latitude: extensions.latitude(),
  longitude: extensions.longitude(),
  radius: z.number().min(0).max(200).default(10),
  diploma: extensions.buildEnum(NIVEAUX_POUR_LBA).default(NIVEAUX_POUR_LBA.INDIFFERENT),
  opco: extensions.buildEnum(OPCOS).optional(),
  opcoUrl: z.string().optional(),
})

export const ZJobOpportunityRome = ZJobOpportunityQuerystringBase.extend({ romes }).strict()
export const ZJobOpportunityRncp = ZJobOpportunityQuerystringBase.extend({ rncp }).strict()
export type IJobOpportunityRome = z.output<typeof ZJobOpportunityRome>
export type IJobOpportunityRncp = z.output<typeof ZJobOpportunityRncp>

export const ZJobQuerystringFranceTravailRome = ZJobOpportunityQuerystringBase.extend({ romes, insee }).strict()
export const ZJobQuerystringFranceTravailRncp = ZJobOpportunityQuerystringBase.extend({ rncp, insee }).strict()
export type IJobOpportunityFranceTravailRome = z.output<typeof ZJobQuerystringFranceTravailRome>
export type IJobOpportunityFranceTravailRncp = z.output<typeof ZJobQuerystringFranceTravailRncp>
