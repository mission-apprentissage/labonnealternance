import axios from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import config from "@/config"
import { formatSlackTable, notifyToSlack } from "./slack-utils"

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
