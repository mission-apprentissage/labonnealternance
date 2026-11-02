import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateComputedJobsPartnersFixture } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import * as slackUtils from "@/common/utils/slack-utils"
import { JobPartnersGuardrailError } from "./jobs-partners-guardrails"
import { isPartnerLocked } from "./partner-processing-lock"
import { cancelRemovedJobsPartnersFlux } from "./process-job-partners"
import { rawToComputedJobsPartners } from "./raw-to-computed-jobs-partners"

vi.mock("@/common/utils/sentry-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/utils/sentry-utils")>()),
  sentryCaptureException: vi.fn(),
}))

useMongo()

const partnerLabel = JOBPARTNERS_LABEL.DECATHLON
const previousImportDate = new Date("2026-10-01T00:00:00.000Z")
const ZTestRaw = z.object({ reference: z.string() })

const importToComputed = () =>
  rawToComputedJobsPartners({
    collectionSource: "raw_decathlon",
    partnerLabel,
    zodInput: ZTestRaw,
    mapper: ({ reference }) => generateComputedJobsPartnersFixture({ partner_job_id: reference, partner_label: partnerLabel }),
  })

const givenPublishedCatalog = async (ids: string[]) => {
  for (const id of ids) {
    await createJobPartner({ partner_job_id: id, partner_label: partnerLabel, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({ partner_job_id: id, partner_label: partnerLabel, created_at: previousImportDate, validated: true })
  }
}

const givenRawFlux = async (docs: object[]) => {
  if (docs.length) {
    await getDbCollection("raw_decathlon").insertMany(docs.map((doc) => ({ ...doc, _id: new ObjectId(), createdAt: new Date() })))
  }
}

const range = (count: number, prefix = "offer") => Array.from({ length: count }, (_, i) => `${prefix}_${i}`)

const countActive = () => getDbCollection("jobs_partners").countDocuments({ partner_label: partnerLabel, offer_status: JOB_STATUS_ENGLISH.ACTIVE })

describe("rawToComputedJobsPartners", () => {
  beforeEach(() => {
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)
    return async () => {
      notifySpy.mockRestore()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("raw_decathlon").deleteMany({})
    }
  })

  it("un flux dont 100 % des offres échouent au mapper n'annule aucune offre active et fait échouer le job", async () => {
    const ids = range(10)
    await givenPublishedCatalog(ids)
    await givenRawFlux(ids.map((id) => ({ ref: id })))

    const importResult = await importToComputed().then(
      () => "resolved",
      (err: Error) => err.message
    )
    await cancelRemovedJobsPartnersFlux().catch(() => null)

    expect.soft(importResult).toMatch(/garde-fou/)
    expect.soft(await countActive()).toBe(10)
    expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ partner_label: partnerLabel, created_at: previousImportDate })).toBe(10)
    expect.soft(slackUtils.notifyToSlack).toHaveBeenCalledWith(expect.objectContaining({ error: true, message: expect.stringContaining("aucune offre transformée") }))
  })

  it("(faux positif) 10 % d'erreurs de transformation restent sous le seuil : le lot remplace le computed précédent", async () => {
    const ids = range(20)
    await givenPublishedCatalog([...ids, "retiree_du_flux"])
    await givenRawFlux([...ids.slice(0, 18).map((reference) => ({ reference })), { ref: "illisible_1" }, { ref: "illisible_2" }])

    const counters = await importToComputed()

    expect.soft(counters).toEqual({ total: 20, success: 18, error: 2, filtered: 0, locked: 0 })
    const computedIds = await getDbCollection("computed_jobs_partners").distinct("partner_job_id", { partner_label: partnerLabel })
    expect.soft(computedIds.sort()).toEqual(ids.slice(0, 18).sort())
    expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ partner_label: partnerLabel, created_at: { $ne: previousImportDate } })).toBe(18)
    expect.soft(slackUtils.notifyToSlack).not.toHaveBeenCalled()
  })

  it("(faux positif) un petit flux au-dessus du taux mais sous le nombre minimal d'erreurs n'est pas bloqué", async () => {
    const ids = range(10)
    await givenPublishedCatalog(ids)
    await givenRawFlux([...ids.slice(0, 7).map((reference) => ({ reference })), { ref: "a" }, { ref: "b" }, { ref: "c" }])

    const counters = await importToComputed()

    expect.soft(counters).toEqual({ total: 10, success: 7, error: 3, filtered: 0, locked: 0 })
    const computedIds = await getDbCollection("computed_jobs_partners").distinct("partner_job_id", { partner_label: partnerLabel })
    expect.soft(computedIds.sort()).toEqual(ids.slice(0, 7).sort())
    expect.soft(slackUtils.notifyToSlack).not.toHaveBeenCalled()
  })

  it("au-delà du seuil d'erreurs, le job échoue et aucune offre ne sort du computed", async () => {
    const ids = range(30)
    await givenPublishedCatalog(ids)
    await givenRawFlux([...ids.slice(0, 20).map((reference) => ({ reference })), ...range(10, "illisible").map((ref) => ({ ref }))])

    await expect(importToComputed()).rejects.toThrow(JobPartnersGuardrailError)

    const computedIds = await getDbCollection("computed_jobs_partners").distinct("partner_job_id", { partner_label: partnerLabel })
    expect.soft(computedIds.sort()).toEqual(ids.sort())
    expect.soft(await getDbCollection("jobs_partners_processing_locks").countDocuments({})).toBe(0)
  })

  it("un doublon de partner_job_id dans le flux est compté en erreur sans écraser la première offre", async () => {
    await givenRawFlux([{ reference: "doublon", title: "premier" }, { reference: "doublon", title: "second" }, ...range(9).map((reference) => ({ reference }))])

    const counters = await importToComputed()

    expect.soft(counters).toMatchObject({ total: 11, success: 10, error: 1 })
    expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ partner_label: partnerLabel, partner_job_id: "doublon" })).toBe(1)
  })

  it("ne supprime ni ne remplace un document revendiqué par un autre traitement", async () => {
    const ids = range(10)
    await givenPublishedCatalog(ids)
    const claimedId = new ObjectId().toString()
    await getDbCollection("computed_jobs_partners").updateMany({ partner_job_id: { $in: ["offer_8", "offer_9"] } }, { $set: { currently_processed_id: claimedId } })
    await givenRawFlux(ids.slice(0, 9).map((reference) => ({ reference })))

    const counters = await importToComputed()

    expect.soft(counters).toEqual({ total: 9, success: 8, error: 0, filtered: 0, locked: 1 })
    const claimed = await getDbCollection("computed_jobs_partners").find({ currently_processed_id: claimedId }).toArray()
    expect.soft(claimed.map(({ partner_job_id, created_at }) => ({ partner_job_id, created_at })).sort((a, b) => a.partner_job_id.localeCompare(b.partner_job_id))).toEqual([
      { partner_job_id: "offer_8", created_at: previousImportDate },
      { partner_job_id: "offer_9", created_at: previousImportDate },
    ])
  })

  it("détient le verrou du partenaire pendant la transformation et le rend ensuite", async () => {
    await givenRawFlux([{ reference: "offer_0" }])
    const lockedDuringMapping: boolean[] = []

    await rawToComputedJobsPartners({
      collectionSource: "raw_decathlon",
      partnerLabel,
      zodInput: ZTestRaw,
      mapper: async ({ reference }) => {
        lockedDuringMapping.push(await isPartnerLocked(partnerLabel))
        return generateComputedJobsPartnersFixture({ partner_job_id: reference, partner_label: partnerLabel })
      },
    })

    expect.soft(lockedDuringMapping).toEqual([true])
    expect.soft(await isPartnerLocked(partnerLabel)).toBe(false)
  })

  it("supprime un document dont la revendication est orpheline", async () => {
    await givenPublishedCatalog(["orpheline", ...range(10)])
    const staleClaim = ObjectId.createFromTime(Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 1000)).toString()
    await getDbCollection("computed_jobs_partners").updateOne({ partner_job_id: "orpheline" }, { $set: { currently_processed_id: staleClaim } })
    await givenRawFlux(range(10).map((reference) => ({ reference })))

    await importToComputed()

    expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ partner_job_id: "orpheline" })).toBe(0)
  })
})
