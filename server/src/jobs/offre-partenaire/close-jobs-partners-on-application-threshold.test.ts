import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveUserWithAccount } from "@tests/utils/user.test.utils"
import type { ObjectId } from "mongodb"
import { generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { closeJobsPartnersOnApplicationThreshold } from "./close-jobs-partners-on-application-threshold"

vi.mock("@/services/mailer.service", () => ({ default: { sendEmail: vi.fn().mockResolvedValue({}) } }))

vi.mock("@/services/search/search-items.service", () => ({
  syncJobPartnersToSearchItemsInBackground: vi.fn(),
}))

useMongo()

describe("closeJobsPartnersOnApplicationThreshold", () => {
  const insertActiveOffer = async (partner_label: JOBPARTNERS_LABEL, applicationCount: number) => {
    const user = await saveUserWithAccount({})
    const job = generateJobsPartnersOfferPrivate({ partner_label, managed_by: user._id, offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_status_history: [] })
    await getDbCollection("jobs_partners").insertOne(job)
    await getDbCollection("applications").insertMany(Array.from({ length: applicationCount }, () => generateApplicationFixture({ job_id: job._id, created_at: new Date() })))
    return job._id
  }

  const getStatus = async (_id: ObjectId) => (await getDbCollection("jobs_partners").findOne({ _id }))?.offer_status

  it("ne ferme que les offres LBA qui ont atteint le seuil passé en CLI", async () => {
    const atThreshold = await insertActiveOffer(JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, 3)
    const belowThreshold = await insertActiveOffer(JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, 2)
    const partnerAtThreshold = await insertActiveOffer(JOBPARTNERS_LABEL.FRANCE_TRAVAIL, 3)

    await closeJobsPartnersOnApplicationThreshold({ threshold: "3" })

    expect.soft(await getStatus(atThreshold)).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(await getStatus(belowThreshold)).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(await getStatus(partnerAtThreshold)).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    const closed = await getDbCollection("jobs_partners").findOne({ _id: atThreshold })
    expect.soft(closed?.offer_status_history.at(-1)).toMatchObject({ reason: "seuil de 3 candidatures atteint", granted_by: "close-jobs-partners-on-application-threshold" })
  })
})
