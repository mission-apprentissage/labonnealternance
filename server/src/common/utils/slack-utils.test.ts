import axios from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import config from "@/config"
import { formatSlackTable, notifyToSlack, splitSlackMessage } from "./slack-utils"

vi.mock("axios")

describe("formatSlackTable", () => {
  it("aligne les colonnes dans un bloc de code, à droite pour les nombres", () => {
    const lines = formatSlackTable(
      ["Partenaire", "Reçues", "Motif"],
      [
        ["France Travail", "13998", "CFA_BLACKLISTED 6415"],
        ["PASS", "4", ""],
      ],
      { alignRight: [false, true, false] }
    )

    expect(lines).toEqual(["```", "Partenaire     Reçues Motif", "France Travail  13998 CFA_BLACKLISTED 6415", "PASS                4", "```"])
  })

  it("(faux positif) un tableau sans ligne garde l'en-tête", () => {
    expect(formatSlackTable(["A", "B"], [])).toEqual(["```", "A B", "```"])
  })
})

describe("splitSlackMessage", () => {
  const table = (rowCount: number) =>
    formatSlackTable(
      ["Partenaire", "Reçues"],
      Array.from({ length: rowCount }, (_, i) => [`Partenaire ${i}`, String(i * 100)])
    )
  const fenceCount = (chunk: string) => chunk.match(/```/g)?.length ?? 0

  it("renvoie un seul morceau quand le message tient", () => {
    expect(splitSlackMessage(["résumé", ...table(2)], 1_000)).toEqual([["résumé", ...table(2)].join("\n")])
  })

  it("coupe entre deux lignes, referme le tableau et le rouvre avec son en-tête", () => {
    const lines = ["résumé", "", "Titre :", ...table(60), "légende"]

    const chunks = splitSlackMessage(lines, 400)

    expect(chunks.length).toBeGreaterThan(2)
    for (const chunk of chunks) {
      expect.soft(chunk.length).toBeLessThanOrEqual(400)
      expect.soft(fenceCount(chunk) % 2).toBe(0)
    }
    for (const chunk of chunks.slice(1, -1)) {
      expect.soft(chunk.split("\n").slice(0, 2)).toEqual(["```", "Partenaire    Reçues"])
    }
    // aucune ligne perdue ni dupliquée, hors en-têtes et délimiteurs ajoutés
    const rows = chunks.flatMap((chunk) => chunk.split("\n")).filter((line) => /^Partenaire \d/.test(line))
    expect(rows).toEqual(table(60).filter((line) => /^Partenaire \d/.test(line)))
    expect(chunks.at(-1)?.endsWith("légende")).toBe(true)
  })

  it("(faux positif) n'ouvre pas un tableau en fin de morceau pour le refermer aussitôt", () => {
    const filler = "x".repeat(180)
    const chunks = splitSlackMessage([filler, ...table(3)], 220)

    expect(chunks[0]).toBe(filler)
    expect(chunks[1]).toBe(table(3).join("\n"))
  })

  it("(faux positif) ne commence pas un morceau par une ligne vide", () => {
    const chunks = splitSlackMessage(["x".repeat(90), "", "y".repeat(90)], 100)

    expect(chunks).toEqual(["x".repeat(90), "y".repeat(90)])
  })

  it("tronque une ligne plus longue que la limite", () => {
    const [chunk] = splitSlackMessage(["z".repeat(500)], 100)

    expect(chunk).toBe(`${"z".repeat(90)}…`)
  })
})

describe("notifyToSlack", () => {
  const jobSlackWebhook = config.jobSlackWebhook

  beforeEach(() => {
    config.jobSlackWebhook = "https://hooks.slack.com/services/jobs"
    vi.mocked(axios.post).mockResolvedValue({})
  })

  afterEach(() => {
    config.jobSlackWebhook = jobSlackWebhook
    vi.mocked(axios.post).mockReset()
  })

  it("envoie sur le canal dédié quand son webhook est renseigné", async () => {
    await notifyToSlack({ subject: "DÉTECTION", message: "test", webhook: "https://hooks.slack.com/services/detection" })

    expect(axios.post).toHaveBeenCalledWith("https://hooks.slack.com/services/detection", { text: expect.stringContaining("test") })
  })

  it.each([
    ["absent", undefined],
    ["vide", ""],
  ])("revient au canal des jobs quand le webhook dédié est %s", async (_, webhook) => {
    await notifyToSlack({ subject: "DÉTECTION", message: "test", webhook })

    expect(axios.post).toHaveBeenCalledWith("https://hooks.slack.com/services/jobs", { text: expect.stringContaining("test") })
  })
})
