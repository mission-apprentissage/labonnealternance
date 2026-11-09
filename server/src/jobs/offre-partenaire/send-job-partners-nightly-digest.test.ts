import { describe, expect, it, vi } from "vitest"
import * as slackUtils from "@/common/utils/slack-utils"
import { SLACK_MESSAGE_MAX_LENGTH } from "@/common/utils/slack-utils"

const findJobsMock = vi.fn()

vi.mock("job-processor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("job-processor")>()
  return { ...mod, findJobs: findJobsMock }
})

// tableau couvert par partner-publication-report.test.ts, qui a besoin de MongoDB
const buildPartnerNightlyTableMock = vi.fn(async (_context: { since: Date; guardrailAlerts?: Map<string, string[]> }) => [] as string[])

vi.mock("./partner-publication-report", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./partner-publication-report")>()
  return { ...mod, buildPartnerNightlyTable: buildPartnerNightlyTableMock }
})

const { sendJobPartnersNightlyDigest } = await import("./send-job-partners-nightly-digest")
const { JobPartnersGuardrailError } = await import("./jobs-partners-guardrails")
const { formatRemovalGuardBlock } = await import("./cancel-removed-jobs-partners")
const { formatPartnerNightlyTable } = await import("./partner-publication-report")

const cronTask = (params: { name: string; status: string; result?: unknown; error?: string | null; started_at?: Date; ended_at?: Date }) => {
  const { name, status, result = null, error = null, started_at, ended_at } = params
  return { name, type: "cron_task", status, started_at, ended_at, output: { duration: "1s", result, error } }
}

// même troncature que job-processor (stringifyError) : 3 premières lignes de la stack
const asJobProcessorError = (err: Error) => err.stack?.split("\n").slice(0, 3).join("\n") ?? err.message

const guardrailTask = (name: string, message: string) =>
  cronTask({ name, status: "errored", error: asJobProcessorError(new JobPartnersGuardrailError(message)), ended_at: new Date("2026-11-09T03:00:00Z") })

const removalBlock = (partner_label: string, removed: number, active: number) => formatRemovalGuardBlock({ partner_label, removed, active, rate: removed / active, maxRate: 0.05 })

// même format que commitRawImport
const importBlock = (importName: string, previousCount: number, collection: string) =>
  `import ${importName} : aucune offre importée, les ${previousCount} offres de l'import précédent sont conservées (${collection})`

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
    // un dump JSON complet contiendrait cette clé (step sans erreur) : sa présence trahirait un retour en arrière
    expect(payload.message).not.toContain("blockJobsPartnersFromFluxCompanyList")
    // les compteurs à 0 et le flag executionDurationError=false ne doivent pas apparaître
    expect(payload.message).not.toContain('"error":0')
    expect(payload.message).not.toContain("executionDurationError")
    // seules les 3 vraies anomalies doivent ressortir, avec leur ratio
    expect(payload.message).toContain("filled.fillSiretInfosForPartners.error : 35/15334")
    expect(payload.message).toContain("filled.fillRomeForPartners.error : 2929/7223")
    expect(payload.message).toContain("filled.validateComputedJobPartners.error : 2795/22524")
  })

  it("ajoute au bilan le tableau par partenaire", async () => {
    findJobsMock.mockResolvedValueOnce([cronTask({ name: "Import RHAlternance", status: "finished", result: { offerInsertCount: 42 } })])
    buildPartnerNightlyTableMock.mockResolvedValueOnce(["", "Partenaires flux (1 à vérifier) :", "```", "Partenaire Reçues", "! PASS 392", "```"])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    await sendJobPartnersNightlyDigest()

    const [payload] = notifySpy.mock.calls[0]
    expect(payload.message).toBe(
      ["1/1 jobs offre-partenaire OK, aucune anomalie.", "", "Partenaires flux (1 à vérifier) :", "```", "Partenaire Reçues", "! PASS 392", "```"].join("\n")
    )
  })

  it("rattache les blocages par garde-fou à leur partenaire dans le tableau, sans les répéter en anomalie", async () => {
    findJobsMock.mockResolvedValueOnce([
      guardrailTask("Process computed and import to Jobs Partners", [removalBlock("RH Alternance", 49, 164), removalBlock("Hellowork", 156, 1985)].join(" ; ")),
      guardrailTask("Import Hellowork", importBlock("Hellowork", 1985, "raw_hellowork")),
      cronTask({ name: "Import EDF", status: "errored", error: asJobProcessorError(new Error("connexion interrompue")) }),
    ])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    await sendJobPartnersNightlyDigest()

    expect(buildPartnerNightlyTableMock.mock.calls.at(-1)?.[0].guardrailAlerts).toEqual(
      new Map([
        ["RH Alternance", ["GF absentes 29.9 %"]],
        ["Hellowork", ["GF absentes 7.9 %", "GF import vide"]],
        ["ATS_Hellowork", ["GF import vide"]],
      ])
    )
    const [payload] = notifySpy.mock.calls[0]
    expect(payload.error).toBe(true)
    // aucune stack trace, aucun blocage répété hors du tableau
    expect(payload.message.split("\n")).toEqual(["0/3 jobs OK, 3 en erreur :", "• Import EDF (errored, 1s : Error: connexion interrompue)"])
  })

  it("(faux positif) garde en ligne un blocage qui ne désigne aucun partenaire", async () => {
    findJobsMock.mockResolvedValueOnce([
      guardrailTask(
        "Process computed and import to Jobs Partners",
        `${removalBlock("Meteojob", 133, 499)} ; partenaires non traités, verrou détenu par un autre traitement : PASS`
      ),
      cronTask({ name: "Import EDF", status: "errored", error: "Error: connexion interrompue" }),
    ])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    await sendJobPartnersNightlyDigest()

    expect(buildPartnerNightlyTableMock.mock.calls.at(-1)?.[0].guardrailAlerts).toEqual(new Map([["Meteojob", ["GF absentes 26.7 %"]]]))
    const [payload] = notifySpy.mock.calls[0]
    expect(payload.message.split("\n")).toEqual([
      "0/2 jobs OK, 2 en erreur :",
      "Garde-fous déclenchés, vérification requise :",
      "• Process computed and import to Jobs Partners : partenaires non traités, verrou détenu par un autre traitement : PASS",
      "Autres anomalies :",
      "• Import EDF (errored, 1s : Error: connexion interrompue)",
    ])
  })

  it("garde la cause d'une erreur enveloppée, sans les lignes de stack", async () => {
    // format de job-processor (stringifyError) : 3 premières lignes de la stack, puis « Caused by: » pour chaque cause
    const error = [
      "Error: importFromStreamInJson: erreur lors de l'import Hellowork",
      "    at importFromStreamInJson (file:///app/server/dist/main.js:1:1)",
      "    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)",
      "Caused by: Error: read ECONNRESET",
      "    at TLSWrap.onStreamRead (node:internal/stream_base_commons:216:20)",
    ].join("\n")
    findJobsMock.mockResolvedValueOnce([cronTask({ name: "Import Hellowork", status: "errored", error })])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    await sendJobPartnersNightlyDigest()

    const [payload] = notifySpy.mock.calls[0]
    expect(payload.message.split("\n")[1]).toBe(
      "• Import Hellowork (errored, 1s : Error: importFromStreamInJson: erreur lors de l'import Hellowork Caused by: Error: read ECONNRESET)"
    )
  })

  it("tronque une erreur trop longue", async () => {
    findJobsMock.mockResolvedValueOnce([cronTask({ name: "Import Zod", status: "errored", error: `ZodError: ${"x".repeat(1_000)}` })])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    await sendJobPartnersNightlyDigest()

    const [payload] = notifySpy.mock.calls[0]
    expect(payload.message.split("\n")[1]).toMatch(/^• Import Zod \(errored, 1s : ZodError: x{290}x*…\)$/)
    expect(payload.message.length).toBeLessThan(400)
  })

  it("(faux positif) sans garde-fou déclenché, les anomalies ne sont pas précédées d'un titre « Autres anomalies »", async () => {
    findJobsMock.mockResolvedValueOnce([cronTask({ name: "Import EDF", status: "errored", error: "Error: connexion interrompue\n    at fetch (file:///app/x.js:1:1)" })])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    await sendJobPartnersNightlyDigest()

    const [payload] = notifySpy.mock.calls[0]
    expect(payload.message.split("\n")).toEqual(["0/1 jobs OK, 1 en erreur :", "• Import EDF (errored, 1s : Error: connexion interrompue)"])
  })

  it("découpe un bilan trop long en messages numérotés, chacun avec un tableau refermé", async () => {
    findJobsMock.mockResolvedValueOnce([cronTask({ name: "Import RHAlternance", status: "finished", result: {} })])
    buildPartnerNightlyTableMock.mockResolvedValueOnce([
      "",
      "Partenaires flux :",
      "```",
      "Partenaire       Reçues",
      ...Array.from({ length: 300 }, (_, i) => `Partenaire ${String(i).padStart(3)}     12345`),
      "```",
      "légende",
    ])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    await sendJobPartnersNightlyDigest()

    const payloads = notifySpy.mock.calls.map(([payload]) => payload)
    expect(payloads.length).toBeGreaterThan(1)
    expect(payloads.map(({ subject }) => subject)).toEqual(payloads.map((_, i) => `Bilan nocturne offres partenaires (${i + 1}/${payloads.length})`))
    for (const { message } of payloads) {
      expect.soft(message.length).toBeLessThanOrEqual(SLACK_MESSAGE_MAX_LENGTH)
      expect.soft((message.match(/```/g)?.length ?? 0) % 2).toBe(0)
    }
    const rows = payloads.flatMap(({ message }) => message.split("\n")).filter((line) => /^Partenaire +\d/.test(line))
    expect(rows).toHaveLength(300)
    expect(payloads.at(-1)?.message.endsWith("légende")).toBe(true)
  })

  it("tient en un seul message sur le bilan de production du 09/11", async () => {
    // Bilan posté le 09/11, coupé par Slack au milieu du tableau de cadence.
    // [partenaire, reçues, B.err, valid., E.val, actives, motif principal, nombre, autres motifs]
    const prodStats: [string, number, number, number, number, number, string?, number?, number?][] = [
      ["Vite un emploi", 2, 2, 0, 0, 0, "CFA", 2, 0],
      ["annonces Atlas", 4, 0, 4, 0, 4],
      ["APEC", 185, 123, 62, 0, 62, "CFA", 72, 6],
      ["ATS_Hellowork", 6629, 6475, 144, 10, 76, "IS_CFA", 5674, 7],
      ["Décathlon", 6, 3, 2, 1, 3, "EXPIRED", 3, 0],
      ["EDF", 1899, 1865, 34, 0, 32, "FULL_TIME", 1439, 4],
      ["Enedis", 129, 118, 11, 0, 11, "FULL_TIME", 91, 1],
      ["France Travail", 14318, 11660, 2657, 1, 3154, "CFA_BLACKLISTED", 6690, 7],
      ["FranceTravail CEGID", 6, 0, 4, 2, 6],
      ["Hellowork", 4580, 2330, 2241, 9, 1985, "CLOSED_COMPANY", 1499, 5],
      ["Jobteaser", 440, 64, 316, 60, 332, "DUPLICATE", 36, 3],
      ["Kelio", 165, 128, 37, 0, 36, "EXPIRED", 128, 0],
      ["L'Etudiant", 180, 149, 31, 0, 27, "EXPIRED", 148, 1],
      ["La Poste", 63, 0, 63, 0, 43],
      ["Le bon coin emploi", 65, 2, 63, 0, 60, "CFA_BLACKLISTED", 1, 1],
      ["Les emplois de l'inclusion", 410, 345, 61, 4, 58, "EXPIRED", 317, 2],
      ["LinkedIn", 9642, 9579, 56, 7, 55, "FULL_TIME", 9399, 4],
      ["Meteojob", 4970, 4584, 356, 30, 499, "CFA_BLACKLISTED", 4406, 4],
      ["Nos Talents Nos Emplois", 894, 811, 83, 0, 82, "EXPIRED", 767, 4],
      ["PASS", 32, 1, 31, 0, 28, "GEOLOCATION_NOT_FOUND", 1, 0],
      ["RH Alternance", 131, 12, 117, 2, 164, "DUPLICATE", 6, 4],
      ["Toulouse metropole", 28, 19, 9, 0, 9, "CFA_BLACKLISTED", 9, 2],
    ]
    const stats = prodStats.map(([partner_label, received, blocked, validated, validationErrors, active, mainReason, mainCount = 0, otherReasons = 0]) => {
      const businessErrors: Record<string, number> = mainReason ? { [mainReason]: mainCount } : {}
      for (let i = 0; i < otherReasons; i++) businessErrors[`AUTRE_${i}`] = 1
      businessErrors.AUTRE_0 = otherReasons ? blocked - mainCount - (otherReasons - 1) : 0
      if (!otherReasons) delete businessErrors.AUTRE_0
      return { partner_label, received, validated, businessErrors, validationErrors, active }
    })
    const cadence = new Map(prodStats.map(([label]) => [label, { runs: 1, skipped: 0, changed: 1, changed_at: new Date("2026-11-08T23:00:00Z") }]))
    buildPartnerNightlyTableMock.mockImplementationOnce(async ({ guardrailAlerts }) => formatPartnerNightlyTable(stats, { guardrailAlerts, cadence }))
    findJobsMock.mockResolvedValueOnce([
      guardrailTask("Import Atlas", importBlock("annonces Atlas", 4, "raw_atlas")),
      guardrailTask("Import La Poste", importBlock("La Poste", 257, "raw_laposte")),
      guardrailTask(
        "Process computed and import to Jobs Partners",
        [removalBlock("RH Alternance", 49, 164), removalBlock("Hellowork", 156, 1985), removalBlock("France Travail", 511, 3155), removalBlock("Meteojob", 133, 499)].join(" ; ")
      ),
      ...Array.from({ length: 95 }, (_, i) =>
        cronTask({
          name: "Process missing Rome and import to Jobs Partners",
          status: "finished",
          result: { filled: { total: 114, error: 114 }, validated: { total: 114, error: 114 } },
          ended_at: new Date(Date.UTC(2026, 10, 9, 0, i * 15)),
        })
      ),
      ...Array.from({ length: 43 }, () => cronTask({ name: "Import EDF", status: "finished", result: {} })),
    ])
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)

    await sendJobPartnersNightlyDigest()

    expect(notifySpy).toHaveBeenCalledTimes(1)
    const [{ message, subject }] = notifySpy.mock.calls[0]
    expect(subject).toBe("Bilan nocturne offres partenaires")
    expect(message.length).toBeLessThanOrEqual(SLACK_MESSAGE_MAX_LENGTH)
    const lines = message.split("\n")
    expect(lines[0]).toBe("43/141 jobs OK, 98 en erreur :")
    expect(lines.find((line) => line.startsWith("! France Travail"))).toMatch(/ GF absentes 16.2 %$/)
    expect(lines.find((line) => line.startsWith("! annonces Atlas"))).toMatch(/ GF import vide$/)
    expect(lines.find((line) => line.startsWith("! La Poste"))).toMatch(/ GF import vide$/)
    expect(lines.find((line) => line.startsWith("! Vite un emploi"))).toMatch(/ 0 publiée$/)
    expect(lines.filter((line) => line.includes("forceCancelRemovedJobsPartners"))).toHaveLength(1)
  })
})
