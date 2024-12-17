import { JOB_STATUS_ENGLISH } from "shared/models"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"

useMongo()

describe("Canceling jobs_partners that have been removed from computed_jobs_partners", () => {
  beforeEach(async () => {
    // créations de plusieurs éléments existants dans jobs partners
    // création de plusieurs éléments dans computed jobs partners . certains avec validated true, d'autres false
    // certains éléments validated de computed sont déjà présents dans jobs partners
    // certains éléments dans jobs partners ne sont pas dans computed
    await createJobPartner({ partner_job_id: "existing_1", partner_label: "ft", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_2", partner_label: "ft", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_3", partner_label: "hw", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_4", partner_label: "hw", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_5", partner_label: "hw", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({ partner_job_id: "existing_1", partner_label: "notft", validated: true })
    await createComputedJobPartner({ partner_job_id: "computed_1", partner_label: "ft", validated: true })
    await createComputedJobPartner({ partner_job_id: "computed_2", partner_label: "ft", validated: false })
    await createComputedJobPartner({ partner_job_id: "existing_3", partner_label: "hw", validated: true })
    await createComputedJobPartner({ partner_job_id: "existing_4", partner_label: "hw", validated: true })
    await createComputedJobPartner({ partner_job_id: "existing_5", partner_label: "hw", validated: false })

    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it.skip("L'annulation dans jobs_partners fonctionne comme attendue : \n- les éléments de jobs_partners qui ne sont plus dans computed doivent être taggés Annulé\n- les éléments de jobs_partners qui sont également dans computed sont toujours présents\n-  aucun éléments de jobs_partners n'a été retiré de la collection", async () => {
    await cancelRemovedJobsPartners()

    // les éléments de jobs_partners qui ne sont plus dans computed doivent être taggés Annulé
    const countCanceledJobsPartners = await getDbCollection("jobs_partners").countDocuments({
      partner_job_id: { $in: ["existing_1", "existing_2"] },
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
    })
    expect.soft(countCanceledJobsPartners).toEqual(2)

    // les éléments de jobs_partners qui sont également dans computed sont toujours présents
    const countRemainingJobsPartners = await getDbCollection("jobs_partners").countDocuments({
      partner_job_id: { $in: ["existing_3", "existing_4", "existing_5"] },
    })
    expect.soft(countRemainingJobsPartners).toEqual(3)

    // aucun éléments de jobs_partners n'a été retiré de la collection
    const countJobsPartners = await getDbCollection("jobs_partners").countDocuments({})
    expect.soft(countJobsPartners).toEqual(5)
  })
})
