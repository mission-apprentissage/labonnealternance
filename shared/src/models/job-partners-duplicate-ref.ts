import { z } from "zod"

export const ZComputedJobPartnersDuplicateRef = z.object({
  partner_job_id: z.string(),
  partner_label: z.string(),
  // "recruiters" : collection supprimée, encore référencée par des doublons en base (#5618)
  collectionName: z
    .enum(["recruiters", "jobs_partners", "computed_jobs_partners"])
    .describe("nom de la collection contenant l'offre correspondant aux champs partner_job_id et partner_label"),
  reason: z.string(),
})

export type IComputedJobPartnersDuplicateRef = z.output<typeof ZComputedJobPartnersDuplicateRef>
