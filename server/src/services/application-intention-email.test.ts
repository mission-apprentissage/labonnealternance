import { ApplicationIntention, RefusalReasons } from "shared/constants/application"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { afterEach, describe, expect, it, vi } from "vitest"

import { sendMailToApplicant } from "./application.service"
import mailer from "./mailer.service"

const COMPANY_NAME = "Boulangerie du test"

const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"])

// Graisse héritée de l'ancêtre le plus proche qui en fixe une, par style inline, <b> ou <strong>. Les règles de <style> ne sont pas lues.
const fontWeightAt = (html: string, text: string): string => {
  // Première occurrence dans un nœud texte du corps : le nom du recruteur figure aussi dans <title> et dans un aria-label.
  const bodyStart = Math.max(html.indexOf("<body"), 0)
  const match = new RegExp(`>[^<]*?${RegExp.escape(text)}`).exec(html.slice(bodyStart))
  if (!match) throw new Error(`Texte absent du corps : ${text}`)
  const index = bodyStart + match.index + match[0].length - text.length

  const openTags: { tag: string; weight: string | null }[] = []
  const before = html.slice(0, index).replace(/<!--[\s\S]*?-->/g, "")
  for (const [, closing, name, attributes] of before.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g)) {
    const tag = name.toLowerCase()
    if (VOID_TAGS.has(tag) || attributes.endsWith("/")) continue
    if (closing) {
      const opened = openTags.findLastIndex((openTag) => openTag.tag === tag)
      if (opened !== -1) openTags.length = opened
      continue
    }
    const inlineWeight = /\sstyle="[^"]*font-weight:\s*([\w-]+)/i.exec(attributes)?.[1] ?? null
    openTags.push({ tag, weight: inlineWeight ?? (tag === "b" || tag === "strong" ? "700" : null) })
  }
  return openTags.findLast(({ weight }) => weight !== null)?.weight ?? "400"
}

const isInBold = (html: string, text: string) => {
  const weight = fontWeightAt(html, text)
  return weight === "bold" || weight === "bolder" || Number(weight) >= 600
}

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

describe("isInBold", () => {
  it.each([
    { html: '<span style="font-weight: 700;">X</span>', expected: true },
    { html: '<td style="font-weight:700">A<br>X</td>', expected: true },
    { html: "<strong>X</strong>", expected: true },
    { html: "<b>X</b>", expected: true },
    { html: '<span style="font-weight:700"><span>X</span></span>', expected: true },
    { html: '<span style="font-weight: 700;">A</span> X', expected: false },
    { html: '<div style="font-weight:400">A<br>X</div>', expected: false },
    { html: "<body>X</body>", expected: false },
    { html: '<title>X</title><body><div style="font-weight:700" aria-label="X">A</div><p>X</p></body>', expected: false },
    { html: '<span style="font-weight: 700;">Voici <em>la</em> réponse : X</span>', expected: true },
    { html: '<span style="font-weight: 700;"><a href="#">lien</a><br/>X</span>', expected: true },
    { html: '<span style="font-weight:600">X</span>', expected: true },
    { html: '<span style="font-weight: bold">X</span>', expected: true },
    { html: '<div style="font-weight:700"><span style="font-weight: 700;">A</span> X</div>', expected: true },
    { html: '<span style="font-weight: 700;"><span style="font-weight:400">X</span></span>', expected: false },
    { html: '<br data-x="font-weight:700">X', expected: false },
    { html: '<!--[if mso]><td style="font-weight:700"><![endif]-->X', expected: false },
  ])("$html → $expected", ({ html, expected }) => {
    expect(isInBold(html, "X")).toBe(expected)
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
