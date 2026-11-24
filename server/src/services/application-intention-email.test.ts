import { isInBold } from "@tests/utils/email.test.utils"
import { ApplicationIntention, RefusalReasons } from "shared/constants/application"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { afterEach, describe, expect, it, vi } from "vitest"

import { sendMailToApplicant } from "./application.service"
import mailer from "./mailer.service"

const COMPANY_NAME = "Boulangerie du test"

const renderIntentionEmail = async ({
  intention,
  company_feedback,
  refusal_reasons = [],
}: {
  intention: ApplicationIntention
  company_feedback: string
  refusal_reasons?: RefusalReasons[]
}) => {
  const sendEmail = vi.spyOn(mailer, "sendEmail").mockResolvedValue({ messageId: "<test@domaine.fr>" })

  await sendMailToApplicant({
    // Hors OFFRES_EMPLOI_LBA, getJobSourceType ne lit pas la base.
    application: generateApplicationFixture({ job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA, company_name: COMPANY_NAME }),
    applicant: generateApplicantFixture(),
    email: "recruteur@domaine.fr",
    phone: "0102030405",
    company_recruitment_intention: intention,
    company_feedback,
    refusal_reasons,
  })

  expect(sendEmail).toHaveBeenCalledTimes(1)
  const { template, data } = sendEmail.mock.calls[0][0]
  return mailer.renderEmail(template, data)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe.each([
  { intention: ApplicationIntention.ENTRETIEN, template: "mail-candidat-entretien" },
  { intention: ApplicationIntention.REFUS, template: "mail-candidat-refus" },
])("e-mail de réponse du recruteur au candidat — $template", ({ intention }) => {
  it("affiche chaque ligne du message du recruteur en graisse normale", async () => {
    const html = await renderIntentionEmail({ intention, company_feedback: "PREMIERE_LIGNE\nDEUXIEME_LIGNE\r\nTROISIEME_LIGNE" })

    for (const line of ["PREMIERE_LIGNE", "DEUXIEME_LIGNE", "TROISIEME_LIGNE"]) {
      expect(isInBold(html, line)).toBe(false)
    }
  })

  it("garde le nom du recruteur en gras", async () => {
    const html = await renderIntentionEmail({ intention, company_feedback: "PREMIERE_LIGNE" })

    expect(isInBold(html, COMPANY_NAME)).toBe(true)
  })

  it("garde les sauts de ligne du message", async () => {
    const html = await renderIntentionEmail({ intention, company_feedback: "PREMIERE_LIGNE\nDEUXIEME_LIGNE\r\nTROISIEME_LIGNE" })

    expect(html).toMatch(/PREMIERE_LIGNE\s*<br[^>]*>\s*DEUXIEME_LIGNE\s*<br[^>]*>\s*TROISIEME_LIGNE/)
  })

  it("échappe le HTML saisi par le recruteur", async () => {
    const html = await renderIntentionEmail({ intention, company_feedback: "DEBUT <b>gras</b><script>alert(1)</script> 1 < 2 FIN" })

    expect(html).not.toContain("<b>gras")
    expect(html).not.toContain("<script>alert(1)")
    expect(html).toMatch(/DEBUT gras\s+1 &lt; 2 FIN/)
  })
})

describe("e-mail de refus avec raisons", () => {
  it("garde les raisons en gras sans y inclure le message", async () => {
    const html = await renderIntentionEmail({
      intention: ApplicationIntention.REFUS,
      company_feedback: "PREMIERE_LIGNE",
      refusal_reasons: [RefusalReasons.ECOLE],
    })

    expect(isInBold(html, RefusalReasons.ECOLE)).toBe(true)
    expect(isInBold(html, "PREMIERE_LIGNE")).toBe(false)
  })
})
