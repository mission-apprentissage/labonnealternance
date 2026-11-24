import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateComputedJobsPartnersFixture } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { getRootLogger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import config from "@/config"
import {
  buildDaytimeRefreshCronString,
  buildDaytimeRefreshCrons,
  DAYTIME_REFRESH_INVALID_CONFIG_JOB_NAME,
  DAYTIME_REFRESH_UNITS,
  type DaytimeRefreshUnit,
  getDaytimeRefreshUnits,
  runDaytimeRefresh,
  runDaytimeRefreshUnit,
} from "./daytime-refresh-cycle"
import { detectDuplicateJobPartners } from "./detect-duplicate-job-partners"
import { fillComputedJobsPartners } from "./fill-computed-jobs-partners"
import { JobPartnersGuardrailError } from "./jobs-partners-guardrails"
import { acquirePartnerLock, PartnerLockUnavailableError, withPartnerLocks } from "./partner-processing-lock"
import { processJobPartnersWithFilter } from "./process-job-partners-for-api"
import { rawToComputedJobsPartners } from "./raw-to-computed-jobs-partners"

vi.mock("@/common/utils/slack-utils")
vi.mock("./partner-processing-lock", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./partner-processing-lock")>()
  return { ...actual, withPartnerLocks: vi.fn(actual.withPartnerLocks) }
})
// Les étapes d'enrichissement appellent des API externes (SIRET, ROME, classification) : les offres du flux arrivent déjà
// validées ou non, et le test de doublons branche la vraie détection.
vi.mock("./fill-computed-jobs-partners", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./fill-computed-jobs-partners")>()),
  fillComputedJobsPartners: vi.fn(async () => ({})),
}))

useMongo()

const A = JOBPARTNERS_LABEL.JOBTEASER
const B = JOBPARTNERS_LABEL.KELIO

type FluxOffer = { id: string; title?: string; validated?: boolean; siret?: string | null; rank?: number }

const givenFlux = async (offers: FluxOffer[]) => {
  await getDbCollection("raw_jobteaser").deleteMany({})
  await getDbCollection("raw_jobteaser").insertMany(offers.map((offer) => ({ _id: new ObjectId(), createdAt: new Date(), ...offer })))
}

const ZFluxOffer = z.object({
  id: z.string(),
  title: z.string().default("Une super offre d'alternance"),
  validated: z.boolean().default(true),
  siret: z.string().nullable().default(null),
  rank: z.number().default(0),
})

/** Transformation réelle du raw (rawToComputedJobsPartners prend le verrou du partenaire, déjà détenu par le cycle). */
const transformFlux = () =>
  rawToComputedJobsPartners({
    collectionSource: "raw_jobteaser",
    zodInput: ZFluxOffer,
    partnerLabel: A,
    mapper: ({ id, title, validated, siret, rank }) =>
      generateComputedJobsPartnersFixture({ partner_label: A, partner_job_id: id, offer_title: title, validated, workplace_siret: siret, rank }),
  })

const unitA = (process: DaytimeRefreshUnit["process"] = transformFlux) => ({ labels: [A], process: vi.fn(process) })

const ids = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => `${prefix}_${index}`)

const givenPublished = (label: JOBPARTNERS_LABEL, partnerJobIds: string[], data: Parameters<typeof createJobPartner>[0] = {}) =>
  Promise.all(partnerJobIds.map((partner_job_id) => createJobPartner({ partner_label: label, partner_job_id, offer_status: JOB_STATUS_ENGLISH.ACTIVE, ...data })))

const snapshot = async (filter: object = {}) => ({
  jobs: await getDbCollection("jobs_partners").find(filter).sort({ partner_label: 1, partner_job_id: 1 }).toArray(),
  computed: await getDbCollection("computed_jobs_partners").find(filter).sort({ partner_label: 1, partner_job_id: 1 }).toArray(),
})

const findJob = (label: JOBPARTNERS_LABEL, partner_job_id: string) => getDbCollection("jobs_partners").findOne({ partner_label: label, partner_job_id })

describe("runDaytimeRefresh", () => {
  beforeEach(() => {
    vi.mocked(fillComputedJobsPartners).mockClear()
    vi.mocked(notifyToSlack).mockReset()
  })

  it("(faux positif) un flux inchangé n'écrit rien : ni computed, ni jobs_partners, ni annulation, ni lba_url", async () => {
    // Le computed d'une offre publiée a été supprimé par processJobPartnersWithFilter : un cycle qui irait jusqu'à
    // l'annulation la retirerait. Une autre n'a pas de lba_url : fillLbaUrl l'écrirait.
    const published = ids("jt", 12)
    await givenPublished(A, published)
    await getDbCollection("jobs_partners").updateOne({ partner_job_id: "jt_1" }, { $set: { lba_url: null } })
    await getDbCollection("computed_jobs_partners").insertMany(
      published.slice(1).map((partner_job_id) => generateComputedJobsPartnersFixture({ partner_label: A, partner_job_id, validated: true }))
    )
    const before = await snapshot()
    const unit = unitA(async () => ({ skipped: true, reason: "contenu identique" }))

    const result = await runDaytimeRefresh(unit)

    expect.soft(result).toEqual({ flux: { skipped: true, reason: "contenu identique" } })
    expect.soft(unit.process).toHaveBeenCalledWith({ skipIfUnchanged: true })
    expect.soft(fillComputedJobsPartners).not.toHaveBeenCalled()
    expect.soft(await snapshot()).toEqual(before)
  })

  it("un fichier tronqué n'annule rien : le garde-fou bloque et le job sort en erreur", async () => {
    const published = ids("jt", 20)
    await givenPublished(A, published)
    await givenFlux(published.slice(0, 5).map((id) => ({ id })))

    await expect(runDaytimeRefresh(unitA())).rejects.toThrow(JobPartnersGuardrailError)

    expect.soft(await getDbCollection("jobs_partners").countDocuments({ partner_label: A, offer_status: JOB_STATUS_ENGLISH.ACTIVE })).toBe(20)
    expect.soft(notifyToSlack).toHaveBeenCalledWith(expect.objectContaining({ subject: `Annulation des offres ${A}` }))
  })

  it("une offre présente dans le flux mais mal enrichie n'est pas annulée ; une offre retirée l'est", async () => {
    const published = ids("jt", 12)
    await givenPublished(A, published)
    await givenFlux([...published.slice(0, 10).map((id) => ({ id })), { id: "jt_10", validated: false }])

    await runDaytimeRefresh(unitA())

    expect.soft((await findJob(A, "jt_10"))?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft((await findJob(A, "jt_11"))?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
  })

  it("une offre inchangée garde son updated_at ; une offre fermée ailleurs n'est pas rouverte", async () => {
    await givenFlux([{ id: "stable" }, { id: "fermee_au_seuil" }])
    await runDaytimeRefresh(unitA())
    const old = new Date("2026-01-01T00:00:00.000Z")
    await getDbCollection("jobs_partners").updateOne({ partner_job_id: "stable" }, { $set: { updated_at: old } })
    await getDbCollection("jobs_partners").updateOne(
      { partner_job_id: "fermee_au_seuil" },
      {
        $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: old },
        $push: { offer_status_history: { date: old, status: JOB_STATUS_ENGLISH.ANNULEE, reason: "seuil de candidatures atteint", granted_by: "application.service" } },
      }
    )

    await runDaytimeRefresh(unitA())

    expect.soft((await findJob(A, "stable"))?.updated_at).toEqual(old)
    const closed = await findJob(A, "fermee_au_seuil")
    expect.soft(closed?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(closed?.updated_at).toEqual(old)
  })

  it("un cycle sur A ne touche à aucune offre ni aucun computed de B, lba_url comprise", async () => {
    // Trois appâts : une offre B sans computed (annulation), sans lba_url (fillLbaUrl), et un computed B validé
    // qui modifierait son offre (import).
    await givenPublished(B, ["kelio_sans_computed", "kelio_sans_lba_url"], { lba_url: null })
    await getDbCollection("computed_jobs_partners").insertOne(
      generateComputedJobsPartnersFixture({ partner_label: B, partner_job_id: "kelio_sans_lba_url", offer_title: "Intitulé modifié chez Kelio", validated: true })
    )
    await givenFlux([{ id: "jt_nouvelle" }])
    const beforeB = await snapshot({ partner_label: B })

    await runDaytimeRefresh(unitA())

    expect.soft(fillComputedJobsPartners).toHaveBeenCalledWith({ addedMatchFilter: { partner_label: { $in: [A] } } })
    expect.soft((await findJob(A, "jt_nouvelle"))?.lba_url).toEqual(expect.stringContaining(config.publicUrl))
    expect.soft(await snapshot({ partner_label: B })).toEqual(beforeB)
  })

  it("(near-miss accepté) la détection de doublons du cycle A annule le doublon moins bien classé de B, comme la nuit", async () => {
    // Exception assumée au critère « A ne modifie pas B » : la comparaison VS jobs_partners porte sur tous les partenaires.
    vi.mocked(fillComputedJobsPartners).mockImplementationOnce(async (context) => ({ detectDuplicateJobPartners: await detectDuplicateJobPartners(context) }) as any)
    const siret = "13002526500013"
    await givenPublished(B, ["kelio_doublon"], { workplace_siret: siret, offer_title: "Développeur web en alternance", rank: 0 })
    await givenPublished(B, ["kelio_autre"], { workplace_siret: "12345678900011", offer_title: "Comptable en alternance" })
    await givenFlux([{ id: "jt_canonique", siret, title: "Développeur web en alternance", rank: 100 }])

    await runDaytimeRefresh(unitA())

    const duplicate = await findJob(B, "kelio_doublon")
    expect.soft(duplicate?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(duplicate?.offer_status_history.at(-1)?.granted_by).toBe("détecteur de doublons")
    expect.soft((await findJob(B, "kelio_autre"))?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
  })

  it.each(["Process computed and import to Jobs Partners", "Process missing Rome and import to Jobs Partners"])(
    "est refusé sans effet quand le partenaire est verrouillé (%s)",
    async (owner) => {
      await givenPublished(A, ids("jt", 12))
      await givenFlux([{ id: "jt_0" }])
      await acquirePartnerLock(A, owner)
      const before = await snapshot()
      const unit = unitA()

      await expect(runDaytimeRefresh(unit)).rejects.toThrow(PartnerLockUnavailableError)

      expect.soft(unit.process).not.toHaveBeenCalled()
      expect.soft(await snapshot()).toEqual(before)
      expect.soft(await getDbCollection("jobs_partners_processing_locks").find({}).toArray()).toEqual([expect.objectContaining({ _id: A, owner })])
    }
  )

  it("est refusé sans effet pendant une reprise processJobPartnersWithFilter du même partenaire (détenteur sur le worker main)", async () => {
    await givenPublished(A, ids("jt", 12))
    await givenFlux([{ id: "jt_0" }])
    await getDbCollection("computed_jobs_partners").insertOne(generateComputedJobsPartnersFixture({ partner_label: A, partner_job_id: "classee_par_batch", validated: true }))
    let releaseFill!: () => void
    let fillEntered!: () => void
    const inFill = new Promise<void>((resolve) => {
      fillEntered = resolve
    })
    vi.mocked(fillComputedJobsPartners).mockImplementationOnce(async () => {
      fillEntered()
      await new Promise<void>((resolve) => {
        releaseFill = resolve
      })
      return {} as Awaited<ReturnType<typeof fillComputedJobsPartners>>
    })
    const reprise = processJobPartnersWithFilter({ partner_label: A, partner_job_id: "classee_par_batch" })
    await inFill
    const before = await snapshot()
    const unit = unitA()

    await expect(runDaytimeRefresh(unit)).rejects.toThrow(PartnerLockUnavailableError)

    expect.soft(unit.process).not.toHaveBeenCalled()
    expect.soft(await snapshot()).toEqual(before)
    releaseFill()
    await reprise
    expect.soft(await findJob(A, "classee_par_batch")).not.toBeNull()
  })

  it("libère le verrou du partenaire en fin de cycle", async () => {
    await givenFlux([{ id: "jt_0" }])

    await runDaytimeRefresh(unitA())

    expect(await getDbCollection("jobs_partners_processing_locks").countDocuments({})).toBe(0)
  })
})

describe("runDaytimeRefreshUnit (CLI)", () => {
  const configured = config.daytimeRefreshPartners

  afterEach(() => {
    config.daytimeRefreshPartners = configured
  })

  it("lance le cycle de l'unité demandée sur ses libellés, même si la configuration ne l'active pas", async () => {
    config.daytimeRefreshPartners = []
    await givenFlux([{ id: "jt_cli" }])
    vi.mocked(withPartnerLocks).mockClear()
    const unit = { name: "Jobteaser", ...unitA() }

    await runDaytimeRefreshUnit({ unit: "Jobteaser" }, [unit])

    expect.soft(vi.mocked(withPartnerLocks).mock.calls[0]?.[0]).toEqual([A])
    expect.soft(unit.process).toHaveBeenCalledWith({ skipIfUnchanged: true })
    expect.soft(await findJob(A, "jt_cli")).not.toBeNull()
  })

  it.each([undefined, "jobteaser", "Monster"])("refuse l'unité %s en listant les unités connues", async (name) => {
    await expect(runDaytimeRefreshUnit({ unit: name })).rejects.toThrow(
      `runDaytimeRefreshUnit : --unit requis, parmi : ${DAYTIME_REFRESH_UNITS.map(({ name }) => name).join(", ")}`
    )
  })
})

describe("génération des crons du cycle de journée", () => {
  const configured = config.daytimeRefreshPartners

  afterEach(() => {
    config.daytimeRefreshPartners = configured
    vi.restoreAllMocks()
  })

  it("sans configuration, aucun cron", () => {
    config.daytimeRefreshPartners = []

    expect(buildDaytimeRefreshCrons()).toEqual({})
  })

  it.each([JOBPARTNERS_LABEL.HELLOWORK, JOBPARTNERS_LABEL.HELLOWORK_BUDDI])("%s seul active l'unité Hellowork entière, avec un log", (label) => {
    config.daytimeRefreshPartners = [label]
    const infoSpy = vi.spyOn(getRootLogger(), "info")

    const units = getDaytimeRefreshUnits()

    expect.soft(units.map(({ name, labels }) => ({ name, labels }))).toEqual([{ name: "Hellowork", labels: [JOBPARTNERS_LABEL.HELLOWORK, JOBPARTNERS_LABEL.HELLOWORK_BUDDI] }])
    expect.soft(Object.keys(buildDaytimeRefreshCrons())).toEqual(["Cycle de journée Hellowork"])
    expect.soft(infoSpy).toHaveBeenCalledWith(expect.objectContaining({ unit: "Hellowork", configured: [label] }), "cycle de journée : unité activée en entier")
  })

  it("les deux libellés Hellowork ne créent qu'un cron", () => {
    config.daytimeRefreshPartners = [JOBPARTNERS_LABEL.HELLOWORK_BUDDI, JOBPARTNERS_LABEL.HELLOWORK]

    expect(Object.keys(buildDaytimeRefreshCrons())).toEqual(["Cycle de journée Hellowork"])
  })

  it.each([
    [JOBPARTNERS_LABEL.MONSTER, `aucun import actif pour ${JOBPARTNERS_LABEL.MONSTER}`],
    [JOBPARTNERS_LABEL.JOOBLE, `aucun import actif pour ${JOBPARTNERS_LABEL.JOOBLE}`],
    [JOBPARTNERS_LABEL.ENGAGEMENT_JEUNES, `aucun import actif pour ${JOBPARTNERS_LABEL.ENGAGEMENT_JEUNES}`],
    ["jobteaser", "jobteaser hors des partenaires flux"],
  ])("refuse %s : aucun cycle planifié, un seul cron qui échoue avec l'erreur", async (label, message) => {
    config.daytimeRefreshPartners = [JOBPARTNERS_LABEL.JOBTEASER, label]
    vi.spyOn(getRootLogger(), "error").mockImplementation(() => undefined)

    expect.soft(() => getDaytimeRefreshUnits()).toThrow(`LBA_DAYTIME_REFRESH_PARTNERS : ${message}`)
    const crons = buildDaytimeRefreshCrons()
    expect
      .soft(Object.entries(crons).map(([name, { tag, cron_string }]) => [name, tag, cron_string]))
      .toEqual([[DAYTIME_REFRESH_INVALID_CONFIG_JOB_NAME, "slave", "0 4-20/4 * * *"]])
    await expect(crons[DAYTIME_REFRESH_INVALID_CONFIG_JOB_NAME]?.handler(new AbortController().signal)).rejects.toThrow(`LBA_DAYTIME_REFRESH_PARTNERS : ${message}`)
  })

  it("un cron par unité, sur le worker slave, décalé de 20 min dans l'ordre de la configuration", () => {
    config.daytimeRefreshPartners = [JOBPARTNERS_LABEL.JOBTEASER, JOBPARTNERS_LABEL.METEOJOB, JOBPARTNERS_LABEL.HELLOWORK, JOBPARTNERS_LABEL.KELIO]

    const crons = buildDaytimeRefreshCrons()

    expect.soft(Object.entries(crons).map(([name, { cron_string }]) => [name, cron_string])).toEqual([
      ["Cycle de journée Jobteaser", "0 4-20/4 * * *"],
      ["Cycle de journée Meteojob", "20 4-20/4 * * *"],
      ["Cycle de journée Hellowork", "40 4-20/4 * * *"],
      ["Cycle de journée Kelio", "0 5-21/4 * * *"],
    ])
    for (const cron of Object.values(crons)) {
      expect.soft(cron).toMatchObject({ tag: "slave" })
      expect.soft(cron).not.toHaveProperty("concurrency")
    }
  })

  /** Minutes depuis minuit de chaque démarrage d'une chaîne « m a-b/4 * * * ». */
  const startMinutes = (cronString: string) => {
    const [minute, hours] = cronString.split(" ")
    const [range, step] = hours.split("/")
    const [first, last] = range.split("-").map(Number)
    return Array.from({ length: Math.floor((last - first) / Number(step)) + 1 }, (_, i) => (first + i * Number(step)) * 60 + Number(minute))
  }

  it("les 21 unités démarrent toutes entre 04h00 et 21h00, cinq fois par jour", () => {
    const starts = DAYTIME_REFRESH_UNITS.map((unit, index) => ({ unit: unit.name, starts: startMinutes(buildDaytimeRefreshCronString(index)) }))
    const outOfWindow = starts.flatMap(({ unit, starts }) =>
      starts.filter((start) => start < 4 * 60 || start > 21 * 60).map((start) => `${unit} à ${Math.floor(start / 60)}h${String(start % 60).padStart(2, "0")}`)
    )

    expect.soft(DAYTIME_REFRESH_UNITS).toHaveLength(21)
    expect.soft(outOfWindow).toEqual([])
    expect.soft(starts.filter(({ starts }) => starts.length !== 5)).toEqual([])
  })

  it("chaque libellé n'appartient qu'à une unité", () => {
    const labels = DAYTIME_REFRESH_UNITS.flatMap(({ labels }) => labels)

    expect(new Set(labels).size).toBe(labels.length)
  })
})
