import axios from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import config from "@/config"
import { notifyToSlack } from "./slack-utils"

vi.mock("axios")

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
