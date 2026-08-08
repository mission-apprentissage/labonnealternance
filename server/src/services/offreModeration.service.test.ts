import { beforeEach, describe, expect, it, vi } from "vitest"

import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

import { moderateFreeText } from "./offreModeration.service"

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

  it("should return the masked input, unmodified by AI, when the Mistral call fails", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(null)
    const result = await moderateFreeText("Rejoignez une equipe dynamique, tel 06 12 34 56 78.")
    expect(result).toBe("Rejoignez une equipe dynamique, tel 06xxxxxxxx.")
  })

  it("should return the AI-corrected text when Mistral responds with valid JSON", async () => {
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
