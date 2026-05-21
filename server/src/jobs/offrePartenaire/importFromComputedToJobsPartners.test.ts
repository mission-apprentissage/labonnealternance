import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
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
    await createComputedJobPartner({ partner_job_id: "computed_5", validated: true, business_error: JOB_PARTNER_BUSINESS_ERROR.CLOSED_COMPANY })

    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("La transition de computed_jobs_partners vers jobs_partners fonctionne comme attendue : \n- les éléments non validated ou avec business_error ne doivent pas se retrouver dans jobs partners\n- les éléments validated et absents initialement de jobs partners doivent se rerouver dans jobs partners\n- les éléments validated et déjà dans jobs partners doivent toujours y être avec les data modifiées à jour", async () => {
    await importFromComputedToJobsPartners()

    // les éléments non validated ou avec business_error ne doivent pas se retrouver dans jobs partners
    const countNonValidatedInJobsPartners = await getDbCollection("jobs_partners").countDocuments({ partner_job_id: { $in: ["computed_2", "computed_4", "computed_5"] } })
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

describe("offer_status_history lors de l'import", () => {
  useMongo()

  afterEach(async () => {
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  })

  it("ajoute une entrée dans offer_status_history quand une offre annulée est réactivée par le flux", async () => {
    await createJobPartner({ partner_job_id: "reactivated_1", offer_status: JOB_STATUS_ENGLISH.ANNULEE })
    await createComputedJobPartner({ partner_job_id: "reactivated_1", offer_status: JOB_STATUS_ENGLISH.ACTIVE, validated: true })

    await importFromComputedToJobsPartners({}, false)

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "reactivated_1" })
    expect.soft(job?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(job?.offer_status_history.map(({ status, reason, granted_by }) => ({ status, reason, granted_by }))).toContainEqual({
      status: JOB_STATUS_ENGLISH.ACTIVE,
      reason: "réactivée par le flux source",
      granted_by: "importFromComputedToJobsPartners",
    })
  })

  it("n'ajoute pas d'entrée de réactivation quand l'offre était déjà active", async () => {
    await createJobPartner({ partner_job_id: "already_active_1", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({ partner_job_id: "already_active_1", offer_status: JOB_STATUS_ENGLISH.ACTIVE, validated: true })

    await importFromComputedToJobsPartners({}, false)

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "already_active_1" })
    expect.soft(job?.offer_status_history.filter(({ reason }) => reason === "réactivée par le flux source")).toHaveLength(0)
  })

  it("n'ajoute pas d'entrée de réactivation quand une offre annulée reste annulée", async () => {
    await createJobPartner({ partner_job_id: "stay_cancelled_1", offer_status: JOB_STATUS_ENGLISH.ANNULEE })
    await createComputedJobPartner({ partner_job_id: "stay_cancelled_1", offer_status: JOB_STATUS_ENGLISH.ANNULEE, validated: true })

    await importFromComputedToJobsPartners({}, false)

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "stay_cancelled_1" })
    expect.soft(job?.offer_status_history.filter(({ reason }) => reason === "réactivée par le flux source")).toHaveLength(0)
  })

  it("copie les entrées offer_status_history depuis computed_jobs_partners", async () => {
    const historyEntry = { date: new Date(), status: JOB_STATUS_ENGLISH.ANNULEE, reason: "supprimée du flux source", granted_by: "cancelRemovedJobsPartners" }
    await createComputedJobPartner({ partner_job_id: "with_history_1", validated: true, offer_status_history: [historyEntry] })

    await importFromComputedToJobsPartners({}, false)

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "with_history_1" })
    expect.soft(job?.offer_status_history.map(({ status, reason, granted_by }) => ({ status, reason, granted_by }))).toContainEqual({
      status: historyEntry.status,
      reason: historyEntry.reason,
      granted_by: historyEntry.granted_by,
    })
  })
})
