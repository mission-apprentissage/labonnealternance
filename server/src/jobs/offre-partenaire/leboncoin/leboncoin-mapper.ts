import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { z } from "zod"
import { blankComputedJobPartner } from "@/jobs/offre-partenaire/fill-computed-jobs-partners"

export const ZLeboncoinJob = z.looseObject({
  redirection: z.string().describe("url de l'offre"),
  ville: z.string(),
  entreprise: z.string(),
  description: z.string(),
  titre: z.string(),
  identifiant: z.string(),
  région: z.string(),
  "code postal": z.string(),
})

export type ILeboncoinJob = z.output<typeof ZLeboncoinJob>

export const leboncoinJobToJobsPartners = (job: ILeboncoinJob): IComputedJobsPartners => {
  const now = new Date()

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(now),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.LEBONCOIN,
    partner_job_id: job.identifiant,
    workplace_name: job.entreprise,
    workplace_address_city: job.ville,
    workplace_address_zipcode: job["code postal"],
    workplace_address_label: `${job.ville} ${job["code postal"]}`,
    offer_title: job.titre,
    offer_description: job.description,
    offer_expiration: dayjs.tz(now).add(2, "months").toDate(),
    offer_multicast: true,
    contract_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
    apply_url: job.redirection,
  }
  return partnerJob
}
