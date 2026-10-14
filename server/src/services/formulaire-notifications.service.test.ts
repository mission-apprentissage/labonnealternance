import { JOB_STATUS_ENGLISH } from "shared"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/user-with-account.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

import config from "@/config"
import { sendMailNouvelleOffre } from "./formulaire-notifications.service"
import mailer from "./mailer.service"

vi.mock("./mailer.service", () => ({ default: { sendEmail: vi.fn().mockResolvedValue(undefined) } }))

describe("sendMailNouvelleOffre", () => {
  beforeEach(() => {
    vi.mocked(mailer.sendEmail).mockClear()
  })

  it.each([
    { is_delegated: true, guideSource: "guide-cfa", utmCampaign: "mail-nouvelle-offre-cfa" },
    { is_delegated: false, guideSource: "guide-recruteur", utmCampaign: "mail-nouvelle-offre-entreprise" },
  ])("pointe la charte de rédaction vers $guideSource quand is_delegated=$is_delegated", async ({ is_delegated, guideSource, utmCampaign }) => {
    const job = generateJobsPartnersOfferPrivate({ is_delegated, offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    await sendMailNouvelleOffre(generateUserWithAccountFixture(), job)

    expect(mailer.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          charteRedactionUrl: `${config.publicUrl}/guide/rediger-son-offre-d-alternance?guide_source=${guideSource}&utm_source=lba&utm_medium=email&utm_campaign=${utmCampaign}`,
        }),
      })
    )
  })
})
