import { isInBold } from "@tests/utils/email.test.utils"
import { generateUserFixture } from "shared/fixtures/user.fixture"
import { afterEach, describe, expect, it, vi } from "vitest"

import { sendCfaAnswerToApplicantEmail } from "./appointment.service"
import mailer from "./mailer.service"

const CFA_NAME = "CFA du test"
const TRAINING_NAME = "BTS Boulangerie du test"

const renderCfaAnswerEmail = async (message: string | null) => {
  const sendEmail = vi.spyOn(mailer, "sendEmail").mockResolvedValue({ messageId: "<test@domaine.fr>" })

  await sendCfaAnswerToApplicantEmail({
    applicant: generateUserFixture(),
    message,
    eligibleTrainingsForAppointment: {
      training_intitule_long: TRAINING_NAME,
      etablissement_formateur_raison_sociale: CFA_NAME,
      lieu_formation_email: "cfa@domaine.fr",
    },
    cfaPhone: "0102030405",
  })

  expect(sendEmail).toHaveBeenCalledTimes(1)
  const { template, data } = sendEmail.mock.calls[0][0]
  return mailer.renderEmail(template, data)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("e-mail de réponse du CFA au candidat", () => {
  it("affiche chaque ligne du message du CFA en graisse normale", async () => {
    const html = await renderCfaAnswerEmail("PREMIERE_LIGNE\nDEUXIEME_LIGNE\r\nTROISIEME_LIGNE")

    for (const line of ["PREMIERE_LIGNE", "DEUXIEME_LIGNE", "TROISIEME_LIGNE"]) {
      expect(isInBold(html, line)).toBe(false)
    }
  })

  it("garde le nom du CFA et celui de la formation en gras", async () => {
    const html = await renderCfaAnswerEmail("PREMIERE_LIGNE")

    expect(isInBold(html, CFA_NAME)).toBe(true)
    expect(isInBold(html, TRAINING_NAME)).toBe(true)
  })

  it("garde les sauts de ligne du message", async () => {
    const html = await renderCfaAnswerEmail("PREMIERE_LIGNE\nDEUXIEME_LIGNE\r\nTROISIEME_LIGNE")

    expect(html).toMatch(/PREMIERE_LIGNE\s*<br[^>]*>\s*DEUXIEME_LIGNE\s*<br[^>]*>\s*TROISIEME_LIGNE/)
  })

  it("échappe le HTML saisi par le CFA", async () => {
    const html = await renderCfaAnswerEmail("DEBUT <b>gras</b><script>alert(1)</script> 1 < 2 FIN")

    expect(html).not.toContain("<b>gras")
    expect(html).not.toContain("<script>alert(1)")
    expect(html).toMatch(/DEBUT gras\s+1 &lt; 2 FIN/)
  })

  it("rend l'e-mail sans message", async () => {
    const html = await renderCfaAnswerEmail(null)

    expect(html).toMatch(new RegExp(`${TRAINING_NAME}\\s*</span>\\s*:(?:\\s*<br[^>]*>)+\\s*</div>`))
  })
})
