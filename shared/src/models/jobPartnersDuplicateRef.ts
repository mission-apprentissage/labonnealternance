import { z } from "zod"

import recruiterModel from "./recruiter.model.js"

export const ZComputedJobPartnersDuplicateRef = z.object({
  partner_job_id: z.string(),
  partner_label: z.string(),
  // hardcoded collection names to avoid cyclic dependancies
  collectionName: z
    .enum([recruiterModel.collectionName, "jobs_partners", "computed_jobs_partners"])
    .describe("nom de la collection contenant l'offre correspondant aux champs partner_job_id et partner_label"),
  reason: z.string(),
})

export type IComputedJobPartnersDuplicateRef = z.output<typeof ZComputedJobPartnersDuplicateRef>
