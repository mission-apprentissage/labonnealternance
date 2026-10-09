import { beforeEach, describe, expect, it, vi } from "vitest"

import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

import { escalateVerdict, parseClassification, verdictFromFindings } from "./offre-classification.prompt"
import { classifyFreeText, classifyOffreFreeTexts } from "./offre-classification.service"

vi.mock("@/services/mistralai/mistralai.service", () => ({
  sendMistralMessages: vi.fn(),
}))

const mistralResponse = (payload: unknown) => JSON.stringify(payload)

describe("classifyFreeText", () => {
  beforeEach(() => {
    vi.mocked(sendMistralMessages).mockReset()
  })

  it("should return conforme without calling Mistral for an empty field", async () => {
    for (const input of [null, undefined, "   "]) {
      const result = await classifyFreeText(input, "job_description")
      expect(result).toMatchObject({ verdict: "conforme", findings: [], status: "ok" })
    }
    expect(sendMistralMessages).not.toHaveBeenCalled()
  })

  it("should mask personal data before sending the text to Mistral", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(mistralResponse({ verdict: "conforme", findings: [] }))
    await classifyFreeText("Contactez-moi au 06 12 34 56 78", "job_description")

    const [{ messages }] = vi.mocked(sendMistralMessages).mock.calls[0]
    const userMessage = messages.find(({ role }) => role === "user")
    expect(userMessage?.content).toContain("06xxxxxxxx")
    expect(userMessage?.content).not.toContain("06 12 34 56 78")
  })

  it("should forbid any rewriting in the system prompt", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(mistralResponse({ verdict: "conforme", findings: [] }))
    await classifyFreeText("un texte quelconque", "job_description")

    const [{ messages }] = vi.mocked(sendMistralMessages).mock.calls[0]
    const systemMessage = messages.find(({ role }) => role === "system")
    expect(systemMessage?.content).toContain("toute réécriture est interdite")
  })

  // Les règles d'annulation du prompt 1.1.0 ont divisé les faux positifs par huit, mais elles
  // ouvrent un contournement trivial si elles portent sur la formule et non sur le fond : il
  // suffirait d'accoler « dans le respect de la réglementation » à n'importe quelle offre.
  it("should keep the anti-bypass clause of the cancellation rules in the system prompt", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(mistralResponse({ verdict: "conforme", findings: [] }))
    await classifyFreeText("un texte quelconque", "job_description")

    const [{ messages }] = vi.mocked(sendMistralMessages).mock.calls[0]
    const systemMessage = messages.find(({ role }) => role === "system")
    expect(systemMessage?.content).toContain("portent sur le FOND, pas sur la formule")
    expect(systemMessage?.content).toContain("la contradiction ne lève pas l'infraction")
  })

  it("should tag each finding with the field it was found in", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(
      mistralResponse({ verdict: "non_conforme", findings: [{ category: "remuneration", severity: "bloquant", verbatim: "des pourboires" }] })
    )
    const result = await classifyFreeText("des pourboires vous seront fournies", "job_employer_description")

    expect(result.findings).toEqual([{ category: "remuneration", severity: "bloquant", verbatim: "des pourboires", champ: "job_employer_description" }])
    expect(result.status).toBe("ok")
  })

  // Le point le plus important du contrat : une indisponibilité de l'étage bloquant ne doit jamais
  // ouvrir la publication, contrairement au correcteur rédactionnel (#5006) dont l'échec est
  // volontairement non bloquant.
  it.each([
    ["a failed Mistral call", null],
    ["a non-JSON response", "désolé, je ne peux pas"],
    ["a response with an unknown category", mistralResponse({ verdict: "non_conforme", findings: [{ category: "inconnue", severity: "bloquant", verbatim: "x" }] })],
    [
      "a response with a whitespace-only verbatim",
      mistralResponse({ verdict: "non_conforme", findings: [{ category: "discrimination", severity: "bloquant", verbatim: " \n\t" }] }),
    ],
    ["a response with an unknown verdict", mistralResponse({ verdict: "peut-etre", findings: [] })],
    ["a response missing the verdict", mistralResponse({ findings: [] })],
  ])("should fall back to a_verifier and status indisponible on %s", async (_label, response) => {
    vi.mocked(sendMistralMessages).mockResolvedValue(response)
    const result = await classifyFreeText("un texte quelconque", "job_description")

    expect(result).toMatchObject({ verdict: "a_verifier", findings: [], status: "indisponible" })
  })

  it("should ignore a rewritten text smuggled into the response", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(mistralResponse({ verdict: "conforme", findings: [], text: "version blanchie de l'offre" }))
    const result = await classifyFreeText("un texte quelconque", "job_description")

    expect(result).toMatchObject({ verdict: "conforme", findings: [] })
    expect(result).not.toHaveProperty("text")
  })
})

describe("verdict reconciliation", () => {
  it("should escalate a conforme verdict contradicted by a blocking finding", () => {
    const parsed = parseClassification(mistralResponse({ verdict: "conforme", findings: [{ category: "discrimination", severity: "bloquant", verbatim: "seules les filles" }] }))
    expect(parsed?.verdict).toBe("non_conforme")
  })

  it("should escalate a conforme verdict contradicted by a doubtful finding", () => {
    const parsed = parseClassification(mistralResponse({ verdict: "conforme", findings: [{ category: "mineurs", severity: "doute", verbatim: "service en bar" }] }))
    expect(parsed?.verdict).toBe("a_verifier")
  })

  it("should keep a non_conforme verdict announced without any finding", () => {
    const parsed = parseClassification(mistralResponse({ verdict: "non_conforme", findings: [] }))
    expect(parsed?.verdict).toBe("non_conforme")
  })

  // Arbitrage de la modération (#5352) : les règles de la charte envoient en revue, jamais en blocage,
  // même quand le modèle les juge bloquantes.
  it("should never block on charter findings alone", () => {
    const parsed = parseClassification(
      mistralResponse({ verdict: "non_conforme", findings: [{ category: "candidature_hors_plateforme", severity: "bloquant", verbatim: "candidatures par e-mail uniquement" }] })
    )
    expect(parsed).toEqual({
      verdict: "a_verifier",
      findings: [{ category: "candidature_hors_plateforme", severity: "doute", verbatim: "candidatures par e-mail uniquement" }],
    })
  })

  it("should flag charter findings announced as conforme", () => {
    const parsed = parseClassification(
      mistralResponse({ verdict: "conforme", findings: [{ category: "experience_exigee", severity: "doute", verbatim: "deux ans d'expérience" }] })
    )
    expect(parsed?.verdict).toBe("a_verifier")
  })

  it("should still block a legal finding reported alongside a charter finding", () => {
    const parsed = parseClassification(
      mistralResponse({
        verdict: "non_conforme",
        findings: [
          { category: "teletravail_integral", severity: "bloquant", verbatim: "100 % télétravail" },
          { category: "discrimination", severity: "bloquant", verbatim: "âgé de 18 à 22 ans" },
        ],
      })
    )
    expect(parsed?.verdict).toBe("non_conforme")
    expect(parsed?.findings.map(({ severity }) => severity)).toEqual(["doute", "bloquant"])
  })

  it("should not cap a non_conforme verdict whose findings are legal doubts", () => {
    const parsed = parseClassification(mistralResponse({ verdict: "non_conforme", findings: [{ category: "mineurs", severity: "doute", verbatim: "service en bar" }] }))
    expect(parsed?.verdict).toBe("non_conforme")
  })

  it("should treat a contact_bypass on already masked coordinates as an off-platform application", () => {
    const parsed = parseClassification(
      mistralResponse({ verdict: "non_conforme", findings: [{ category: "contact_bypass", severity: "bloquant", verbatim: "au 06xxxxxxxx ou à emxxx@xxx.fr" }] })
    )
    expect(parsed).toEqual({
      verdict: "a_verifier",
      findings: [{ category: "candidature_hors_plateforme", severity: "doute", verbatim: "au 06xxxxxxxx ou à emxxx@xxx.fr" }],
    })
  })

  it("should block an off-platform application whose coordinate is disguised", () => {
    const parsed = parseClassification(
      mistralResponse({
        verdict: "a_verifier",
        findings: [{ category: "candidature_hors_plateforme", severity: "doute", verbatim: "CV à recrutement arobase monentreprise point fr" }],
      })
    )
    expect(parsed).toEqual({
      verdict: "non_conforme",
      findings: [{ category: "contact_bypass", severity: "bloquant", verbatim: "CV à recrutement arobase monentreprise point fr" }],
    })
  })

  it("should keep blocking a disguised coordinate written next to a masked one", () => {
    const parsed = parseClassification(
      mistralResponse({ verdict: "non_conforme", findings: [{ category: "contact_bypass", severity: "bloquant", verbatim: "emxxx@xxx.fr ou jean arobase gmail point com" }] })
    )
    expect(parsed?.verdict).toBe("non_conforme")
    expect(parsed?.findings[0].category).toBe("contact_bypass")
  })

  it("should not mistake ordinary wording for a disguised coordinate", () => {
    const parsed = parseClassification(
      mistralResponse({
        verdict: "a_verifier",
        findings: [{ category: "candidature_hors_plateforme", severity: "doute", verbatim: "déposez votre CV au point de vente ou sur emxxx@xxx.fr" }],
      })
    )
    expect(parsed?.verdict).toBe("a_verifier")
    expect(parsed?.findings[0].category).toBe("candidature_hors_plateforme")
  })

  it("should derive the verdict from the severities of the findings", () => {
    expect(verdictFromFindings([])).toBe("conforme")
    expect(verdictFromFindings([{ category: "mineurs", severity: "doute", verbatim: "x" }])).toBe("a_verifier")
    expect(
      verdictFromFindings([
        { category: "mineurs", severity: "doute", verbatim: "x" },
        { category: "remuneration", severity: "bloquant", verbatim: "y" },
      ])
    ).toBe("non_conforme")
  })

  it("should keep the most severe of two verdicts", () => {
    expect(escalateVerdict("conforme", "a_verifier")).toBe("a_verifier")
    expect(escalateVerdict("non_conforme", "a_verifier")).toBe("non_conforme")
    expect(escalateVerdict("conforme", "conforme")).toBe("conforme")
  })
})

describe("classifyOffreFreeTexts", () => {
  beforeEach(() => {
    vi.mocked(sendMistralMessages).mockReset()
  })

  it("should merge the findings of both fields and keep the most severe verdict", async () => {
    vi.mocked(sendMistralMessages)
      .mockResolvedValueOnce(mistralResponse({ verdict: "a_verifier", findings: [{ category: "mineurs", severity: "doute", verbatim: "en bar" }] }))
      .mockResolvedValueOnce(mistralResponse({ verdict: "non_conforme", findings: [{ category: "discrimination", severity: "bloquant", verbatim: "sans enfants" }] }))

    const result = await classifyOffreFreeTexts({ job_description: "service en bar", job_employer_description: "candidats sans enfants" })

    expect(result.verdict).toBe("non_conforme")
    expect(result.findings).toHaveLength(2)
    expect(result.findings.map(({ champ }) => champ)).toEqual(["job_description", "job_employer_description"])
    expect(result.status).toBe("ok")
  })

  it("should report indisponible as soon as one of the two calls fails", async () => {
    vi.mocked(sendMistralMessages)
      .mockResolvedValueOnce(mistralResponse({ verdict: "conforme", findings: [] }))
      .mockResolvedValueOnce(null)

    const result = await classifyOffreFreeTexts({ job_description: "missions de gestion", job_employer_description: "entreprise de services" })

    expect(result).toMatchObject({ verdict: "a_verifier", status: "indisponible" })
  })

  it("should stay conforme when both fields are clean", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(mistralResponse({ verdict: "conforme", findings: [] }))
    const result = await classifyOffreFreeTexts({ job_description: "missions de gestion", job_employer_description: "entreprise de services" })

    expect(result).toMatchObject({ verdict: "conforme", findings: [], status: "ok" })
  })
})
