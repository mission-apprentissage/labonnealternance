import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/user-with-account.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import mailer from "@/services/mailer.service"
import { closeJobsOnApplicationThreshold } from "./application-threshold.service"

vi.mock("@/services/mailer.service", () => ({
  default: { sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: ["test@example.com"] }) },
}))

vi.mock("@/services/search/search-items.service", () => ({
  syncJobPartnersToSearchItemsInBackground: vi.fn(),
}))

useMongo()

describe("closeJobsOnApplicationThreshold", () => {
  const sendEmail = vi.mocked(mailer.sendEmail)

  beforeEach(() => {
    sendEmail.mockClear()
  })

  const insertLbaOffer = async (overrides = {}) => {
    const recruiter = generateUserWithAccountFixture({ email: `recruteur-${new ObjectId()}@test.fr` })
    await getDbCollection("userswithaccounts").insertOne(recruiter)
    const job = generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_status_history: [],
      managed_by: recruiter._id,
      ...overrides,
    })
    await getDbCollection("jobs_partners").insertOne(job)
    return job._id
  }

  it("ne trace et ne notifie qu'une fois quand les deux déclencheurs passent sur la même offre", async () => {
    const id = await insertLbaOffer()

    const first = await closeJobsOnApplicationThreshold([id])
    const second = await closeJobsOnApplicationThreshold([id])

    expect.soft(first).toHaveLength(1)
    expect.soft(second).toHaveLength(0)
    const job = await getDbCollection("jobs_partners").findOne({ _id: id })
    expect.soft(job?.offer_status_history).toHaveLength(1)
    expect.soft(job?.offer_status_history[0]).toMatchObject({
      status: JOB_STATUS_ENGLISH.ANNULEE,
      reason: "seuil de 80 candidatures atteint",
      granted_by: "close-jobs-partners-on-application-threshold",
    })
    expect.soft(sendEmail).toHaveBeenCalledOnce()
  })

  it("ne touche pas une offre déjà close", async () => {
    const id = await insertLbaOffer({ offer_status: JOB_STATUS_ENGLISH.POURVUE })

    const closed = await closeJobsOnApplicationThreshold([id])

    expect.soft(closed).toHaveLength(0)
    const job = await getDbCollection("jobs_partners").findOne({ _id: id })
    expect.soft(job?.offer_status).toBe(JOB_STATUS_ENGLISH.POURVUE)
    expect.soft(sendEmail).not.toHaveBeenCalled()
  })

  it("ne notifie pas le gestionnaire d'une offre partenaire", async () => {
    const id = await insertLbaOffer({ partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL })

    await closeJobsOnApplicationThreshold([id])

    const job = await getDbCollection("jobs_partners").findOne({ _id: id })
    expect.soft(job?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(sendEmail).not.toHaveBeenCalled()
  })
})
