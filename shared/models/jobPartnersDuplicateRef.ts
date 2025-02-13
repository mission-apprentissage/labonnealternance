import { z } from "zod"

import { zObjectId } from "./common.js"
import recruiterModel from "./recruiter.model.js"

export const ZComputedJobPartnersDuplicateRef = z.object({
  otherOfferId: zObjectId,
  // hardcoded collection names to avoid cyclic dependancies
  collectionName: z.enum([recruiterModel.collectionName, "jobs_partners", "computed_jobs_partners"]).describe("nom de la collection contenant l'offre avec _id=otherOfferId"),
  reason: z.string(),
})

export type IComputedJobPartnersDuplicateRef = z.output<typeof ZComputedJobPartnersDuplicateRef>
