import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"

useMongo()

describe("Importing computed_jobs_partners into jobs_partners", () => {
  const oldDesc = "description existante dans la table jobs_partners"
  const newDesc = "nouvelle description dans la table computed_jobs_partners"

  beforeEach(async () => {
    // créations de plusieurs éléments existants dans jobs partners
    // création de plusieurs éléments dans computed jobs partners . certains avec validated true, d'autres false
    // certains éléments validated de computed sont déjà présents dans jobs partners
    await createJobPartner({ partner_job_id: "existing_1" })
    await createJobPartner({ partner_job_id: "existing_2" })
    await createJobPartner({ partner_job_id: "existing_3", offer_description: oldDesc })
    await createComputedJobPartner({ partner_job_id: "computed_1", validated: true })
    await createComputedJobPartner({ partner_job_id: "computed_2", validated: false })
    await createComputedJobPartner({ partner_job_id: "existing_3", offer_description: newDesc, validated: true })
    await createComputedJobPartner({ partner_job_id: "computed_4", validated: false })

    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("La transition de computed_jobs_partners vers jobs_partners fonctionne comme attendue : \n- les éléments non validated ne doivent pas se retrouver dans jobs partners\n- les éléments validated et absents initialement de jobs partners doivent se rerouver dans jobs partners\n- les éléments validated et déjà dans jobs partners doivent toujours y être avec les data modifiées à jour", async () => {
    await importFromComputedToJobsPartners()

    // les éléments non validated ne doivent pas se retrouver dans jobs partners
    const countNonValidatedInJobsPartners = await getDbCollection("jobs_partners").countDocuments({ partner_job_id: { $in: ["computed_2", "computed_4"] } })
    expect.soft(countNonValidatedInJobsPartners).toEqual(0)

    // les éléments validated et absents initialement de jobs partners doivent se rerouver dans jobs partners
    const countNewValidatedInJobsPartners = await getDbCollection("jobs_partners").countDocuments({ partner_job_id: { $in: ["computed_1"] } })
    expect.soft(countNewValidatedInJobsPartners).toEqual(1)

    // les éléments qui existaient avant l'import sont toujours là
    const countExistingStillHere = await getDbCollection("jobs_partners").countDocuments({ partner_job_id: { $in: ["existing_1", "existing_2", "existing_3"] } })
    expect.soft(countExistingStillHere).toEqual(3)

    // les éléments validated et déjà dans jobs partners doivent toujours y être avec les data modifiées à jour
    const existing_3 = await getDbCollection("jobs_partners").findOne({ partner_job_id: "existing_3" })
    expect.soft(existing_3?.offer_description === newDesc)
  })
})
