import { beforeEach, describe, expect, it, vi } from "vitest"

import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

import { improveFreeText, moderateFreeText } from "./offre-moderation.service"

vi.mock("@/services/mistralai/mistralai.service", () => ({
  sendMistralMessages: vi.fn(),
}))

describe("moderateFreeText", () => {
  beforeEach(() => {
    vi.mocked(sendMistralMessages).mockReset()
  })

  it("should return null for empty/null/undefined input without calling Mistral", async () => {
    expect(await moderateFreeText(null)).toBe(null)
    expect(await moderateFreeText(undefined)).toBe(null)
    expect(await moderateFreeText("   ")).toBe(null)
    expect(sendMistralMessages).not.toHaveBeenCalled()
  })

  it("should mask personal data before sending the text to Mistral", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(null)
    await moderateFreeText("Contactez-moi au 06 12 34 56 78")

    const [{ messages }] = vi.mocked(sendMistralMessages).mock.calls[0]
    const userMessage = messages.find((m) => m.role === "user")
    expect(userMessage?.content).toContain("06xxxxxxxx")
    expect(userMessage?.content).not.toContain("06 12 34 56 78")
  })

  it("should instruct the AI to also mask contact info formulated to bypass the deterministic masking", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(null)
    await moderateFreeText("un texte quelconque")

    const [{ messages }] = vi.mocked(sendMistralMessages).mock.calls[0]
    const systemMessage = messages.find((m) => m.role === "system")
    expect(systemMessage?.content).toContain("contourner")
    expect(systemMessage?.content).toContain("06xxxxxxxx")
    expect(systemMessage?.content).toContain("emxxx@xxx.fr")
    expect(systemMessage?.content).toContain("www.lien_non_disponible.com")
  })

  it("should return the masked input, unmodified by AI, when the Mistral call fails", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(null)
    const result = await moderateFreeText("Rejoignez une equipe dynamique, tel 06 12 34 56 78.")
    expect(result).toBe("Rejoignez une equipe dynamique, tel 06xxxxxxxx.")
  })

  it("should return the text Mistral responds with, when the JSON is valid", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue('{"text": "Rejoignez une équipe dynamique et bienveillante."}')
    const result = await moderateFreeText("rejoint une equipe dynamik")
    expect(result).toBe("Rejoignez une équipe dynamique et bienveillante.")
  })

  it("should fall back to the masked input when Mistral responds with malformed JSON", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue("not json at all")
    const result = await moderateFreeText("Poste ouvert aux candidats motives.")
    expect(result).toBe("Poste ouvert aux candidats motives.")
  })

  it("should re-mask any personal data the AI might have reintroduced in its response", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue('{"text": "Contactez le recrutement au 07 98 76 54 32."}')
    const result = await moderateFreeText("un texte quelconque")
    expect(result).toBe("Contactez le recrutement au 06xxxxxxxx.")
  })

  it("should strip executable HTML from the AI response before returning it", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue('{"text": "<script>alert(1)</script>Rejoignez-nous"}')
    const result = await moderateFreeText("un texte quelconque")
    expect(result).not.toContain("<script")
    expect(result).toContain("Rejoignez-nous")
  })
})

describe("improveFreeText", () => {
  beforeEach(() => {
    vi.mocked(sendMistralMessages).mockReset()
  })

  it("should return null for empty/null/undefined input without calling Mistral", async () => {
    expect(await improveFreeText(null)).toBe(null)
    expect(await improveFreeText("   ")).toBe(null)
    expect(sendMistralMessages).not.toHaveBeenCalled()
  })

  it("should mask personal data before sending the text to Mistral", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(null)
    await improveFreeText("Contactez-moi au 06 12 34 56 78")

    const [{ messages }] = vi.mocked(sendMistralMessages).mock.calls[0]
    expect(messages.find((m) => m.role === "user")?.content).toContain("06xxxxxxxx")
  })

  it("should return the rewritten text when Mistral responds with valid JSON", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue('{"text": "Rejoignez une équipe dynamique et bienveillante."}')
    expect(await improveFreeText("rejoint une equipe dynamik")).toBe("Rejoignez une équipe dynamique et bienveillante.")
  })
})

/**
 * La passe d'enregistrement ne doit pas réécrire : sinon le texte stocké n'est pas celui que le
 * recruteur a validé à l'écran, y compris quand il a refusé la proposition de l'IA.
 */
describe("séparation modération / amélioration", () => {
  const getSystemPrompt = async (fn: (text: string) => Promise<string | null>): Promise<string> => {
    vi.mocked(sendMistralMessages).mockReset()
    vi.mocked(sendMistralMessages).mockResolvedValue(null)
    await fn("un texte quelconque")
    const [{ messages }] = vi.mocked(sendMistralMessages).mock.calls[0]
    return messages.find((m) => m.role === "system")?.content ?? ""
  }

  it("should forbid any rewriting on the save pass, and ask for it on the explicit pass", async () => {
    const moderationPrompt = await getSystemPrompt(moderateFreeText)
    const improvementPrompt = await getSystemPrompt(improveFreeText)

    expect(moderationPrompt).toContain("Ne corrige pas l'orthographe")
    expect(moderationPrompt).toContain("Ne reformule pas")
    expect(moderationPrompt).not.toContain("Améliore la structure")

    expect(improvementPrompt).toContain("Corrige l'orthographe")
    expect(improvementPrompt).toContain("Améliore la structure")

    expect(moderationPrompt).not.toBe(improvementPrompt)
  })

  /**
   * Consigne de suppression + texte saturé de mentions illégales = réécriture, pas suppression :
   * le modèle invente une offre licite. Aucune des deux passes ne juge le contenu, c'est l'office du
   * classifieur (#5497), qui a besoin du texte réel.
   */
  it("should keep content judgement out of both passes", async () => {
    const moderationPrompt = await getSystemPrompt(moderateFreeText)
    const improvementPrompt = await getSystemPrompt(improveFreeText)

    for (const prompt of [moderationPrompt, improvementPrompt]) {
      expect(prompt).not.toContain("Supprime ou reformule")
    }
    expect(moderationPrompt).toContain("Ne supprime aucun contenu")
    expect(improvementPrompt).toContain("Ne supprime pas et ne reformule pas les propos problématiques")
  })

  it("should limit the save pass to masking", async () => {
    const moderationPrompt = await getSystemPrompt(moderateFreeText)

    expect(moderationPrompt).toContain("est ta seule modification autorisée")
    expect(moderationPrompt).toContain("renvoie-le à l'identique, caractère pour caractère")
  })

  it("should forbid the improvement pass from adding anything to the source text", async () => {
    const improvementPrompt = await getSystemPrompt(improveFreeText)

    expect(improvementPrompt).toContain("N'introduis aucune information absente du texte source")
    expect(improvementPrompt).toContain("mention de conformité")
  })

  it("should ask the improvement pass for plain text: its output is reinjected in a textarea", async () => {
    expect(await getSystemPrompt(improveFreeText)).toContain("sans markdown")
  })

  it("should keep the personal-data rules on both passes", async () => {
    for (const prompt of [await getSystemPrompt(moderateFreeText), await getSystemPrompt(improveFreeText)]) {
      expect(prompt).toContain("contourner")
      expect(prompt).toContain("06xxxxxxxx")
      expect(prompt).toContain("emxxx@xxx.fr")
      expect(prompt).toContain("www.lien_non_disponible.com")
    }
  })
})
