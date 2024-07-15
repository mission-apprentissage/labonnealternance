import { NIVEAUX_POUR_LBA, OPCOS } from "../constants/recruteur"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

const romes = z.array(extensions.romeCode())
const rncp = extensions.rncpCode()
const insee = extensions.inseeCode()

const zJobOpportunityQuerystringBase = z.object({
  latitude: extensions.latitude(),
  longitude: extensions.longitude(),
  radius: z.number().min(0).max(200).default(10),
  diploma: extensions.buildEnum(NIVEAUX_POUR_LBA).default(NIVEAUX_POUR_LBA.INDIFFERENT),
  opco: extensions.buildEnum(OPCOS).optional(),
  opcoUrl: z.string().optional(),
})

export const zJobOpportunityRome = zJobOpportunityQuerystringBase.extend({ romes }).strict()
export const zJobOpportunityRncp = zJobOpportunityQuerystringBase.extend({ rncp }).strict()
type IJobOpportunityRome = z.output<typeof zJobOpportunityRome>
type IJobOpportunityRncp = z.output<typeof zJobOpportunityRncp>
export type IJobOpportunityRomeRncp = IJobOpportunityRome | IJobOpportunityRncp

export const zJobQuerystringFranceTravailRome = zJobOpportunityQuerystringBase.extend({ romes, insee }).strict()
export const zJobQuerystringFranceTravailRncp = zJobOpportunityQuerystringBase.extend({ rncp, insee }).strict()
type IJobOpportunityFranceTravailRome = z.output<typeof zJobQuerystringFranceTravailRome>
type IJobOpportunityFranceTravailRncp = z.output<typeof zJobQuerystringFranceTravailRncp>
export type IJobOpportunityFranceTravailRomeRncp = IJobOpportunityFranceTravailRome | IJobOpportunityFranceTravailRncp
