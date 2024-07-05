import { z } from "zod"
import { zObjectId } from "zod-mongodb-schema"

import { NIVEAUX_POUR_LBA, OPCOS, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "../constants"
import { LBA_ITEM_TYPE } from "../constants/lbaitem"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"

const zJobOpportunityIdentifiant = z.object({
  id: z.union([zObjectId, extensions.siret]),
  type: z.enum([LBA_ITEM_TYPE.RECRUTEURS_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]),
})

const zJobOpportunityContract = z.array(extensions.buildEnum(TRAINING_CONTRACT_TYPE))

const zJobOpportunityApply = z.object({
  url: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
})

const zJobOpportunityWorkplace = z.object({
  siret: extensions.siret,
  name: z.string(),
  description: z.string().nullable(),
  size: z.string().nullable(),
  website: z.string().nullable(),
  location: z.object({
    address: z.string(),
    lattitude: z.string(),
    longitude: z.string(),
  }),
  domaine: z.object({
    idcc: z.number().nullable(),
    opco: extensions.buildEnum(OPCOS),
    naf: z.object({
      code: z.string().nullable(),
      label: z.string().nullable(),
    }),
  }),
})

const zJobOpportunityOffer = z.object({
  title: z.string(),
  start: z.date(),
  duration: z.number().nullable(),
  immediateStart: z.boolean().nullable(),
  description: z.string(),
  diplomaLevelLabel: extensions.buildEnum(NIVEAUX_POUR_LBA),
  desiredSkills: z.string(),
  toBeAcquiredSkills: z.string(),
  accessCondition: z.string(),
  remote: extensions.buildEnum(TRAINING_REMOTE_TYPE),
  publication: z.object({
    creation: z.date(),
    expiration: z.date(),
  }),
  meta: z.object({
    origin: z.string(),
    count: z.number(),
  }),
})

const zJobOpportunity = z.object({
  identifiant: zJobOpportunityIdentifiant,
  contract: zJobOpportunityContract,
  jobOffre: zJobOpportunityOffer.nullable(),
  workplace: zJobOpportunityWorkplace,
  apply: zJobOpportunityApply,
})

export type IJobOpportunity = z.output<typeof zJobOpportunity>
