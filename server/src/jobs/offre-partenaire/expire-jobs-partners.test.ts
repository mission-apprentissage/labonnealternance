import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveUserWithAccount } from "@tests/utils/user.test.utils"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import dayjs from "shared/helpers/dayjs"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import mailer from "@/services/mailer.service"
import { expireJobsPartners } from "./expire-jobs-partners"

vi.mock("@/services/mailer.service", () => ({ default: { sendEmail: vi.fn().mockResolvedValue({}) } }))

useMongo()

describe("expireJobsPartners", () => {
  beforeEach(() => {
    vi.mocked(mailer.sendEmail).mockClear()
  })

  it("expire une offre en modération sans décision comme une offre publiée, sans lui annoncer qu'elle n'est plus visible", async () => {
    const user = await saveUserWithAccount({})
    const expired = dayjs().subtract(1, "day").toDate()
    const offers = [JOB_STATUS_ENGLISH.ACTIVE, JOB_STATUS_ENGLISH.EN_MODERATION, JOB_STATUS_ENGLISH.EN_ATTENTE].map((offer_status) =>
      generateJobsPartnersOfferPrivate({
        partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
        managed_by: user._id,
        offer_status,
        offer_expiration: expired,
        offer_title: offer_status,
      })
    )
    await getDbCollection("jobs_partners").insertMany(offers)

    await expireJobsPartners()

    const statuses = await getDbCollection("jobs_partners")
      .find({}, { projection: { offer_title: 1, offer_status: 1 } })
      .toArray()
    expect(Object.fromEntries(statuses.map(({ offer_title, offer_status }) => [offer_title, offer_status]))).toEqual({
      [JOB_STATUS_ENGLISH.ACTIVE]: JOB_STATUS_ENGLISH.ANNULEE,
      [JOB_STATUS_ENGLISH.EN_MODERATION]: JOB_STATUS_ENGLISH.ANNULEE,
      [JOB_STATUS_ENGLISH.EN_ATTENTE]: JOB_STATUS_ENGLISH.EN_ATTENTE,
    })
    expect(vi.mocked(mailer.sendEmail).mock.calls.map(([{ data }]) => (data as { offres: { job_title: string }[] }).offres.map(({ job_title }) => job_title))).toEqual([
      [JOB_STATUS_ENGLISH.ACTIVE],
    ])
  })
})
