import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_STATUS } from "shared/models"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"

useMongo()

describe("Canceling jobs_partners that have been removed from computed_jobs_partners", () => {
  beforeEach(async () => {
    // créations de plusieurs éléments existants dans jobs partners
    // création de plusieurs éléments dans computed jobs partners . certains avec validated true, d'autres false
    // certains éléments validated de computed sont déjà présents dans jobs partners
    // certains éléments dans jobs partners ne sont pas dans computed
    await createJobPartner({ partner_job_id: "existing_1", offer_status: JOB_STATUS.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_2", offer_status: JOB_STATUS.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_3", offer_status: JOB_STATUS.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_4", offer_status: JOB_STATUS.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_5", offer_status: JOB_STATUS.ACTIVE })
    await createComputedJobPartner({ partner_job_id: "computed_1", validated: true })
    await createComputedJobPartner({ partner_job_id: "computed_2", validated: false })
    await createComputedJobPartner({ partner_job_id: "existing_3", validated: true })
    await createComputedJobPartner({ partner_job_id: "existing_4", validated: true })
    await createComputedJobPartner({ partner_job_id: "existing_5", validated: false })

    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("L'annulation dans jobs_partners fonctionne comme attendue : \n- les éléments devant être ann\n- les éléments validated et absents initialement de jobs partners doivent se rerouver dans jobs partners\n- les éléments validated et déjà dans jobs partners doivent toujours y être avec les data modifiées à jour", async () => {
    await cancelRemovedJobsPartners()

    // // les éléments non validated ne doivent pas se retrouver dans jobs partners
    const countCanceledJobsPartners = await getDbCollection("jobs_partners").countDocuments({
      partner_job_id: { $in: ["existing_1", "existing_2"] },
      offer_status: JOB_STATUS.ANNULEE,
    })
    expect.soft(countCanceledJobsPartners).toEqual(2)

    const collectionA = await getDbCollection("jobs_partners").find().toArray()
    console.log(collectionA.map((doc) => doc.partner_job_id))
    const collectionB = await getDbCollection("computed_jobs_partners").find().toArray()
    console.log(collectionB.map((doc) => doc.partner_job_id))

    // // les éléments validated et absents initialement de jobs partners doivent se rerouver dans jobs partners
    // const countNewValidatedInJobsPartners = await getDbCollection("jobs_partners").countDocuments({ partner_job_id: { $in: ["computed_1"] } })
    // expect.soft(countNewValidatedInJobsPartners).toEqual(1)

    // // les éléments qui existaient avant l'import sont toujours là
    // const countExistingStillHere = await getDbCollection("jobs_partners").countDocuments({ partner_job_id: { $in: ["existing_1", "existing_2", "existing_3"] } })
    // expect.soft(countExistingStillHere).toEqual(3)

    // // les éléments validated et déjà dans jobs partners doivent toujours y être avec les data modifiées à jour
    // const existing_3 = await getDbCollection("jobs_partners").findOne({ partner_job_id: "existing_3" })
    // expect.soft(existing_3?.offer_description === newDesc)
  })
})
