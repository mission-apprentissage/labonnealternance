import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { EntrepriseEngagementSources } from "shared/models/referentielEngagementEntreprise.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { refreshEntrepriseEngagementJobsPartners, refreshReferentielEngagementFranceTravail } from "./refreshEntrepriseEngagementJobsPartners"

vi.mock("node:fs/promises", () => ({
  default: {
    readFile: vi.fn(),
  },
}))

const ENGAGED_SIRET = "12345678900011"
const NOT_ENGAGED_SIRET = "98765432100022"

useMongo()

describe("refreshReferentielEngagementFranceTravail", () => {
  beforeEach(async () => {
    return async () => {
      await getDbCollection("referentiel_engagement_entreprise").deleteMany({})
    }
  })

  const mockCsvWithSirets = async (sirets: string[]) => {
    const fs = await import("node:fs/promises")
    const csvContent = ["SIRET", ...sirets].join("\n")
    vi.mocked(fs.default.readFile).mockResolvedValue(Buffer.from(csvContent))
  }

  it("should insert new siret with FRANCE_TRAVAIL source", async () => {
    // given
    await mockCsvWithSirets([ENGAGED_SIRET])
    // when
    await refreshReferentielEngagementFranceTravail()
    // then
    const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: ENGAGED_SIRET })
    expect(doc).not.toBeNull()
    expect(doc?.sources).toContain(EntrepriseEngagementSources.FRANCE_TRAVAIL)
    expect(doc?.engagement).toBe("handicap")
  })

  it("should add FRANCE_TRAVAIL source to existing entry without duplicating", async () => {
    // given
    await getDbCollection("referentiel_engagement_entreprise").insertOne({
      _id: new ObjectId(),
      siret: ENGAGED_SIRET,
      engagement: "handicap",
      sources: [EntrepriseEngagementSources.LBA],
      created_at: new Date(),
      updated_at: new Date(),
    })
    await mockCsvWithSirets([ENGAGED_SIRET])
    // when
    await refreshReferentielEngagementFranceTravail()
    // then
    const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: ENGAGED_SIRET })
    expect(doc?.sources).toContain(EntrepriseEngagementSources.FRANCE_TRAVAIL)
    expect(doc?.sources).toContain(EntrepriseEngagementSources.LBA)
    expect(doc?.sources.filter((s) => s === EntrepriseEngagementSources.FRANCE_TRAVAIL)).toHaveLength(1)
  })

  it("should not duplicate FRANCE_TRAVAIL source when already present", async () => {
    // given
    await getDbCollection("referentiel_engagement_entreprise").insertOne({
      _id: new ObjectId(),
      siret: ENGAGED_SIRET,
      engagement: "handicap",
      sources: [EntrepriseEngagementSources.FRANCE_TRAVAIL],
      created_at: new Date(),
      updated_at: new Date(),
    })
    await mockCsvWithSirets([ENGAGED_SIRET])
    // when
    await refreshReferentielEngagementFranceTravail()
    // then
    const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: ENGAGED_SIRET })
    expect(doc?.sources.filter((s) => s === EntrepriseEngagementSources.FRANCE_TRAVAIL)).toHaveLength(1)
  })

  it("should process multiple sirets from csv", async () => {
    // given
    const siret2 = "11111111100033"
    await mockCsvWithSirets([ENGAGED_SIRET, siret2])
    // when
    await refreshReferentielEngagementFranceTravail()
    // then
    const docs = await getDbCollection("referentiel_engagement_entreprise").find({}).toArray()
    expect(docs).toHaveLength(2)
    expect(docs.map((d) => d.siret)).toContain(ENGAGED_SIRET)
    expect(docs.map((d) => d.siret)).toContain(siret2)
  })

  it("should update updated_at on upsert", async () => {
    // given
    const before = new Date("2020-01-01")
    await getDbCollection("referentiel_engagement_entreprise").insertOne({
      _id: new ObjectId(),
      siret: ENGAGED_SIRET,
      engagement: "handicap",
      sources: [EntrepriseEngagementSources.LBA],
      created_at: before,
      updated_at: before,
    })
    await mockCsvWithSirets([ENGAGED_SIRET])
    // when
    await refreshReferentielEngagementFranceTravail()
    // then
    const doc = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret: ENGAGED_SIRET })
    expect(doc?.updated_at.getTime()).toBeGreaterThan(before.getTime())
  })
})

describe("refreshEntrepriseEngagementJobsPartners", () => {
  beforeEach(async () => {
    await getDbCollection("referentiel_engagement_entreprise").insertOne({
      _id: new ObjectId(),
      siret: ENGAGED_SIRET,
      engagement: "handicap",
      sources: [EntrepriseEngagementSources.FRANCE_TRAVAIL],
      created_at: new Date(),
      updated_at: new Date(),
    })

    return async () => {
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("referentiel_engagement_entreprise").deleteMany({})
    }
  })

  it("should set contract_is_disabled_elligible=true for active job with engaged siret", async () => {
    // given
    await createJobPartner({ workplace_siret: ENGAGED_SIRET, offer_status: JOB_STATUS_ENGLISH.ACTIVE, contract_is_disabled_elligible: false })
    // when
    await refreshEntrepriseEngagementJobsPartners()
    // then
    const [job] = await getDbCollection("jobs_partners").find({}).toArray()
    expect(job.contract_is_disabled_elligible).toBe(true)
  })

  it("should set contract_is_disabled_elligible=false for active job with non-engaged siret", async () => {
    // given
    await createJobPartner({ workplace_siret: NOT_ENGAGED_SIRET, offer_status: JOB_STATUS_ENGLISH.ACTIVE, contract_is_disabled_elligible: true })
    // when
    await refreshEntrepriseEngagementJobsPartners()
    // then
    const [job] = await getDbCollection("jobs_partners").find({}).toArray()
    expect(job.contract_is_disabled_elligible).toBe(false)
  })

  it("should set contract_is_disabled_elligible=false for active job with null siret", async () => {
    // given
    await createJobPartner({ workplace_siret: null, offer_status: JOB_STATUS_ENGLISH.ACTIVE, contract_is_disabled_elligible: true })
    // when
    await refreshEntrepriseEngagementJobsPartners()
    // then
    const [job] = await getDbCollection("jobs_partners").find({}).toArray()
    expect(job.contract_is_disabled_elligible).toBe(false)
  })

  it("should not update non-active jobs", async () => {
    // given
    await createJobPartner({ workplace_siret: ENGAGED_SIRET, offer_status: JOB_STATUS_ENGLISH.ANNULEE, contract_is_disabled_elligible: false })
    // when
    await refreshEntrepriseEngagementJobsPartners()
    // then
    const [job] = await getDbCollection("jobs_partners").find({}).toArray()
    expect(job.contract_is_disabled_elligible).toBe(false)
  })

  it("should ignore siret present in referentiel only with non-FRANCE_TRAVAIL source", async () => {
    // given
    const otherSiret = "11111111100033"
    await getDbCollection("referentiel_engagement_entreprise").insertOne({
      _id: new ObjectId(),
      siret: otherSiret,
      engagement: "handicap",
      sources: [EntrepriseEngagementSources.LBA],
      created_at: new Date(),
      updated_at: new Date(),
    })
    await createJobPartner({ workplace_siret: otherSiret, offer_status: JOB_STATUS_ENGLISH.ACTIVE, contract_is_disabled_elligible: false })
    // when
    await refreshEntrepriseEngagementJobsPartners()
    // then
    const [job] = await getDbCollection("jobs_partners").find({}).toArray()
    expect(job.contract_is_disabled_elligible).toBe(false)
  })

  it("should handle multiple active jobs correctly", async () => {
    // given
    await createJobPartner({ partner_job_id: "job-1", workplace_siret: ENGAGED_SIRET, offer_status: JOB_STATUS_ENGLISH.ACTIVE, contract_is_disabled_elligible: false })
    await createJobPartner({ partner_job_id: "job-2", workplace_siret: NOT_ENGAGED_SIRET, offer_status: JOB_STATUS_ENGLISH.ACTIVE, contract_is_disabled_elligible: true })
    await createJobPartner({ partner_job_id: "job-3", workplace_siret: null, offer_status: JOB_STATUS_ENGLISH.ACTIVE, contract_is_disabled_elligible: true })
    await createJobPartner({ partner_job_id: "job-4", workplace_siret: ENGAGED_SIRET, offer_status: JOB_STATUS_ENGLISH.ANNULEE, contract_is_disabled_elligible: false })
    // when
    await refreshEntrepriseEngagementJobsPartners()
    // then
    const jobs = await getDbCollection("jobs_partners").find({}).sort({ partner_job_id: 1 }).toArray()
    expect.soft(jobs.find((j) => j.partner_job_id === "job-1")?.contract_is_disabled_elligible).toBe(true)
    expect.soft(jobs.find((j) => j.partner_job_id === "job-2")?.contract_is_disabled_elligible).toBe(false)
    expect.soft(jobs.find((j) => j.partner_job_id === "job-3")?.contract_is_disabled_elligible).toBe(false)
    // non-active job untouched
    expect.soft(jobs.find((j) => j.partner_job_id === "job-4")?.contract_is_disabled_elligible).toBe(false)
  })

  it("should update updated_at for active jobs", async () => {
    // given
    const before = new Date("2020-01-01")
    await createJobPartner({ workplace_siret: ENGAGED_SIRET, offer_status: JOB_STATUS_ENGLISH.ACTIVE, updated_at: before })
    // when
    await refreshEntrepriseEngagementJobsPartners()
    // then
    const [job] = await getDbCollection("jobs_partners").find({}).toArray()
    expect(job.updated_at.getTime()).toBeGreaterThan(before.getTime())
  })
})
