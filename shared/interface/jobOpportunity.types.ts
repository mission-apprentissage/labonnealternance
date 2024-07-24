import { z } from "zod"
import { zObjectId } from "zod-mongodb-schema"

import { NIVEAUX_POUR_LBA, OPCOS, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "../constants"
import { JOB_OPPORTUNITY_TYPE } from "../constants/lbaitem"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"

const zJobOpportunityIdentifiant = z.object({
  id: z.union([zObjectId, extensions.siret]),
  type: extensions.buildEnum(JOB_OPPORTUNITY_TYPE),
})

const zJobOpportunityContract = z.array(extensions.buildEnum(TRAINING_CONTRACT_TYPE))

const zJobOpportunityApply = z.object({
  url: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
})

const zJobOpportunityWorkplace = z.object({
  siret: extensions.siret.nullable(),
  name: z.string(),
  description: z.string().nullable(),
  size: z.string().nullable(),
  website: z.string().nullable(),
  location: z.object({
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  domaine: z.object({
    idcc: z.number().nullable(),
    opco: extensions.buildEnum(OPCOS).nullable(),
    naf: z.object({
      code: z.string().nullable(),
      label: z.string().nullable(),
    }),
  }),
})

const zJobOpportunityOffer = z.object({
  title: z.string(),
  start: z.date().nullable(),
  duration: z.union([z.number(), z.string()]).nullable(),
  immediateStart: z.boolean().nullable(),
  description: z.string(),
  diplomaLevelLabel: extensions.buildEnum(NIVEAUX_POUR_LBA).nullable(),
  desiredSkills: z.union([z.array(z.any()), z.string()]).nullable(),
  toBeAcquiredSkills: z.union([z.array(z.any()), z.string()]).nullable(),
  accessCondition: z.union([z.array(z.any()), z.string()]).nullable(),
  remote: extensions.buildEnum(TRAINING_REMOTE_TYPE).nullable(),
  publication: z.object({
    creation: z.date(),
    expiration: z.date().nullable(),
  }),
  meta: z.object({
    origin: z.string().nullable(),
    count: z.number(),
  }),
})

export const zJobOpportunity = z.object({
  identifiant: zJobOpportunityIdentifiant,
  contract: zJobOpportunityContract.nullable(),
  jobOffre: zJobOpportunityOffer.nullable(),
  workplace: zJobOpportunityWorkplace,
  apply: zJobOpportunityApply,
})

export type IJobOpportunity = z.output<typeof zJobOpportunity>
