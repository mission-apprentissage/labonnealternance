import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveUserWithAccount } from "@tests/utils/user.test.utils"
import dayjs from "shared/helpers/dayjs"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import mailer from "@/services/mailer.service"
import { recruiterOfferExpirationReminderJob } from "./recruiterOfferExpirationReminderJob"

vi.mock("@/services/mailer.service", () => {
  return {
    default: {
      sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: ["test@example.com"] }),
      renderEmail: vi.fn().mockResolvedValue("<html>Test Email</html>"),
    },
  }
})

vi.mock("@/common/utils/slackUtils", () => {
  return {
    notifyToSlack: vi.fn().mockResolvedValue(undefined),
  }
})

useMongo()

describe("recruiterOfferExpirationReminderJob", () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    return async () => {
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("userswithaccounts").deleteMany({})
    }
  })

  it("utilise un fallback sur workplace_brand si workplace_name est vide", async () => {
    const user = await saveUserWithAccount({
      email: "recruteur@email.fr",
      first_name: "Jean",
      last_name: "Dupont",
    })

    const offer = await createJobPartner({
      managed_by: user._id,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_expiration: dayjs().add(7, "day").add(1, "hour").toDate(),
      workplace_name: null,
      workplace_brand: "ACME Brand",
      workplace_legal_name: "ACME Legal",
      relance_mail_expiration_J7: null,
    })

    await recruiterOfferExpirationReminderJob(7)

    expect.soft(vi.mocked(mailer.sendEmail)).toHaveBeenCalledTimes(1)
    expect.soft(vi.mocked(mailer.sendEmail).mock.calls[0]?.[0]?.data?.establishment_raison_sociale).toBe("ACME Brand")

    const updatedOffer = await getDbCollection("jobs_partners").findOne({ _id: offer._id })
    expect.soft(updatedOffer?.relance_mail_expiration_J7).toBeDefined()
  })
})
