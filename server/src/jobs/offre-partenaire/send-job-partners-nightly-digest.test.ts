import { describe, expect, it, vi } from "vitest"
import * as slackUtils from "@/common/utils/slack-utils"

const findJobsMock = vi.fn()

vi.mock("job-processor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("job-processor")>()
  return { ...mod, findJobs: findJobsMock }
})

const { sendJobPartnersNightlyDigest } = await import("./send-job-partners-nightly-digest")

const cronTask = (params: { name: string; status: string; result?: unknown; error?: string | null; started_at?: Date; ended_at?: Date }) => {
  const { name, status, result = null, error = null, started_at, ended_at } = params
  return { name, type: "cron_task", status, started_at, ended_at, output: { duration: "1s", result, error } }
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

  it("regroupe plusieurs exécutions en anomalie du même job en une seule ligne", async () => {
    findJobsMock.mockResolvedValueOnce([
      cronTask({ name: "Process missing Rome and import to Jobs Partners", status: "errored", error: "timeout", ended_at: new Date("2026-08-10T06:00:00Z") }),
      cronTask({ name: "Process missing Rome and import to Jobs Partners", status: "errored", error: "timeout", ended_at: new Date("2026-08-10T06:15:00Z") }),
      cronTask({ name: "Process missing Rome and import to Jobs Partners", status: "errored", error: "dernier timeout", ended_at: new Date("2026-08-10T06:30:00Z") }),
    ])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    const result = await sendJobPartnersNightlyDigest()

    expect(result).toEqual({ total: 3, anomalies: 3 })
    const [payload] = notifySpy.mock.calls[0]
    const occurrences = payload.message.split("Process missing Rome and import to Jobs Partners").length - 1
    expect(occurrences).toBe(1)
    expect(payload.message).toContain("3 exécutions en anomalie")
    expect(payload.message).toContain("dernier timeout")
  })

  it("détecte une anomalie signalée par un booléen *Error* (ex. dépassement de durée)", async () => {
    findJobsMock.mockResolvedValueOnce([
      cronTask({ name: "Import RHAlternance", status: "finished", result: { offerInsertCount: 42 } }),
      cronTask({
        name: "Process computed and import to Jobs Partners",
        status: "finished",
        result: { steps: { detectDuplicateJobPartners: { executionDurationInSeconds: 400, executionDurationError: true } } },
      }),
    ])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    const result = await sendJobPartnersNightlyDigest()

    expect(result).toEqual({ total: 2, anomalies: 1 })
    const [payload] = notifySpy.mock.calls[0]
    expect(payload.error).toBe(true)
    expect(payload.message).toContain("Process computed and import to Jobs Partners")
  })

  it("résume les erreurs imbriquées au lieu de dumper le JSON complet (cas réel de recette)", async () => {
    findJobsMock.mockResolvedValueOnce([
      cronTask({
        name: "Process computed and import to Jobs Partners",
        status: "finished",
        result: {
          filled: {
            blockJobsPartnersFromFluxCompanyList: { total: 40945, success: 40945, error: 0 },
            fillSiretInfosForPartners: { total: 15334, success: 15299, error: 35 },
            fillRomeForPartners: { total: 7223, success: 4294, error: 2929 },
            blockBadRomeJobsPartners: { modifiedCount: 13 },
            detectDuplicateJobPartners: { executionDurationInSeconds: 29, executionDurationError: false },
            validateComputedJobPartners: { total: 22524, success: 19729, error: 2795 },
          },
          imported: { total: 19729, success: 19729, error: 0 },
        },
      }),
    ])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    await sendJobPartnersNightlyDigest()

    const [payload] = notifySpy.mock.calls[0]
    // les compteurs à 0 et le flag executionDurationError=false ne doivent pas apparaître
    expect(payload.message).not.toContain("JSON")
    expect(payload.message).not.toContain('"error":0')
    expect(payload.message).not.toContain("executionDurationError")
    // seules les 3 vraies anomalies doivent ressortir, avec leur ratio
    expect(payload.message).toContain("filled.fillSiretInfosForPartners.error : 35/15334")
    expect(payload.message).toContain("filled.fillRomeForPartners.error : 2929/7223")
    expect(payload.message).toContain("filled.validateComputedJobPartners.error : 2795/22524")
  })
})
