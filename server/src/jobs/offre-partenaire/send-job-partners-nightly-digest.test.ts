import { describe, expect, it, vi } from "vitest"
import * as slackUtils from "@/common/utils/slack-utils"

const findJobsMock = vi.fn()

vi.mock("job-processor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("job-processor")>()
  return { ...mod, findJobs: findJobsMock }
})

const { sendJobPartnersNightlyDigest } = await import("./send-job-partners-nightly-digest")

const cronTask = (params: { name: string; status: string; result?: unknown; error?: string | null; started_at?: Date }) => {
  const { name, status, result = null, error = null, started_at } = params
  return { name, type: "cron_task", status, started_at, output: { duration: "1s", result, error } }
}

describe("sendJobPartnersNightlyDigest", () => {
  it("n'envoie rien si aucun job n'a tourné dans la fenêtre", async () => {
    findJobsMock.mockResolvedValueOnce([])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    const result = await sendJobPartnersNightlyDigest()

    expect(result).toEqual({ total: 0, anomalies: 0 })
    expect(notifySpy).not.toHaveBeenCalled()
  })

  it("envoie un message calme quand tous les jobs sont OK", async () => {
    findJobsMock.mockResolvedValueOnce([
      cronTask({ name: "Import RHAlternance", status: "finished", result: { offerInsertCount: 42 } }),
      cronTask({ name: "Import Decathlon", status: "finished", result: { total: 10, success: 10, error: 0 } }),
    ])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    const result = await sendJobPartnersNightlyDigest()

    expect(result).toEqual({ total: 2, anomalies: 0 })
    expect(notifySpy).toHaveBeenCalledTimes(1)
    const [payload] = notifySpy.mock.calls[0]
    expect(payload.error).toBe(false)
    expect(payload.message).toContain("2/2 jobs offre-partenaire OK")
  })

  it("regroupe les jobs en erreur dans un unique message", async () => {
    findJobsMock.mockResolvedValueOnce([
      cronTask({ name: "Import RHAlternance", status: "finished", result: { offerInsertCount: 42 } }),
      cronTask({ name: "Import Decathlon", status: "finished", result: { total: 10, success: 8, error: 2 } }),
      cronTask({ name: "Import EDF", status: "errored", error: "boom" }),
    ])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    const result = await sendJobPartnersNightlyDigest()

    expect(result).toEqual({ total: 3, anomalies: 2 })
    expect(notifySpy).toHaveBeenCalledTimes(1)
    const [payload] = notifySpy.mock.calls[0]
    expect(payload.error).toBe(true)
    expect(payload.message).toContain("1/3 jobs OK, 2 en erreur")
    expect(payload.message).toContain("Import Decathlon")
    expect(payload.message).toContain("Import EDF")
    expect(payload.message).toContain("boom")
  })

  it("interroge job_processor.jobs sur le périmètre offre-partenaire, sans inclure le digest lui-même", async () => {
    findJobsMock.mockResolvedValueOnce([])
    vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    await sendJobPartnersNightlyDigest()

    expect(findJobsMock).toHaveBeenCalledTimes(1)
    const [filter] = findJobsMock.mock.calls[0]
    expect(filter.type).toBe("cron_task")
    expect(filter.name.$in).toContain("Import RHAlternance")
    expect(filter.name.$in).not.toContain("Bilan nocturne offres partenaires")
    // un job "running" n'a pas de ended_at : il doit rester inclus malgré la fenêtre temporelle
    expect(filter.$or).toContainEqual({ status: "running" })
  })

  it("signale un job encore en cours à l'heure du digest comme une anomalie", async () => {
    findJobsMock.mockResolvedValueOnce([
      cronTask({ name: "Import RHAlternance", status: "finished", result: { offerInsertCount: 42 } }),
      cronTask({ name: "Import Emploi Inclusion", status: "running", started_at: new Date("2026-08-10T00:00:00Z") }),
    ])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    const result = await sendJobPartnersNightlyDigest()

    expect(result).toEqual({ total: 2, anomalies: 1 })
    const [payload] = notifySpy.mock.calls[0]
    expect(payload.error).toBe(true)
    expect(payload.message).toContain("Import Emploi Inclusion")
    expect(payload.message).toContain("toujours en cours")
  })
})
