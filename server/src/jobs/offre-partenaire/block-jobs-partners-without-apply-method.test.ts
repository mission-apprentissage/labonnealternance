import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateComputedJobsPartnersFull } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { blockJobsPartnersWithoutApplyMethod } from "./block-jobs-partners-without-apply-method"
import { cancelRemovedJobsPartners } from "./cancel-removed-jobs-partners"
import { importFromComputedToJobsPartners } from "./import-from-computed-to-jobs-partners"
import { validateComputedJobPartners } from "./validate-computed-job-partners"

const NO_APPLY = { apply_url: null, apply_email: null, apply_phone: null }

const givenComputed = (overrides: Partial<IComputedJobsPartners>) =>
  givenSomeComputedJobPartners([{ ...generateComputedJobsPartnersFull({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "offre" }), ...overrides }])

const getComputed = () => getDbCollection("computed_jobs_partners").findOne({ partner_job_id: "offre" })

describe("blockJobsPartnersWithoutApplyMethod", () => {
  useMongo()

  beforeEach(() => async () => {
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  })

  it.each([
    ["null", NO_APPLY],
    ["null et apply_phone vide", { ...NO_APPLY, apply_phone: "" }],
    ["null et apply_phone fait de blancs", { ...NO_APPLY, apply_phone: " \n\t " }],
  ])("bloque une offre aux apply_* %s", async (_, apply) => {
    await givenComputed(apply)

    await blockJobsPartnersWithoutApplyMethod({})

    expect((await getComputed())?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.NO_APPLY_METHOD)
  })

  it("bloque une offre dont les trois apply_* sont absents", async () => {
    await givenComputed({})
    await getDbCollection("computed_jobs_partners").updateOne({ partner_job_id: "offre" }, { $unset: { apply_url: "", apply_email: "", apply_phone: "" } })

    await blockJobsPartnersWithoutApplyMethod({})

    expect((await getComputed())?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.NO_APPLY_METHOD)
  })

  it.each([
    ["apply_url", { ...NO_APPLY, apply_url: "https://exemple.fr/postuler" }],
    ["apply_email", { ...NO_APPLY, apply_email: "rh@exemple.fr" }],
    ["apply_phone", { ...NO_APPLY, apply_phone: "0102030405" }],
    ["apply_phone entouré de blancs", { ...NO_APPLY, apply_phone: " 0102030405 " }],
  ])("laisse passer une offre avec un seul moyen de candidature : %s", async (_, apply) => {
    await givenComputed(apply)

    await blockJobsPartnersWithoutApplyMethod({})

    expect((await getComputed())?.business_error).toBeNull()
  })

  it.each([JOBPARTNERS_LABEL.RECRUTEURS_LBA, JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA])("ne contrôle pas %s", async (partner_label) => {
    await givenComputed({ ...NO_APPLY, partner_label })

    await blockJobsPartnersWithoutApplyMethod({})

    expect((await getComputed())?.business_error).toBeNull()
  })

  it("garde un business_error déjà posé", async () => {
    await givenComputed({ ...NO_APPLY, business_error: JOB_PARTNER_BUSINESS_ERROR.CFA })

    await blockJobsPartnersWithoutApplyMethod({})

    expect((await getComputed())?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.CFA)
  })

  it("se limite au filtre du contexte", async () => {
    await givenComputed(NO_APPLY)

    await blockJobsPartnersWithoutApplyMethod({ addedMatchFilter: { partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE } })

    expect((await getComputed())?.business_error).toBeNull()
  })

  it("une offre publiée qui perd ses moyens de candidature est annulée, puis réactivée quand le flux les rétablit", async () => {
    await createJobPartner({ partner_job_id: "offre", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await givenComputed(NO_APPLY)
    const runPipeline = async () => {
      await blockJobsPartnersWithoutApplyMethod({})
      await validateComputedJobPartners({})
      await importFromComputedToJobsPartners()
      await cancelRemovedJobsPartners({ partner_label: JOBPARTNERS_LABEL.HELLOWORK }, { removalGuard: false })
    }
    const getJob = () => getDbCollection("jobs_partners").findOne({ partner_job_id: "offre" })

    await runPipeline()

    const cancelled = await getJob()
    expect.soft(cancelled?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(cancelled?.offer_status_history.at(-1)).toMatchObject({ reason: JOB_PARTNER_BUSINESS_ERROR.NO_APPLY_METHOD, granted_by: "cancel-removed-jobs-partners" })

    // raw-to-computed remplace le document à chaque import du flux : business_error repart de null.
    await getDbCollection("computed_jobs_partners").updateOne({ partner_job_id: "offre" }, { $set: { apply_url: "https://exemple.fr/postuler", business_error: null } })
    await runPipeline()

    const reactivated = await getJob()
    expect.soft(reactivated?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(reactivated?.apply_url).toBe("https://exemple.fr/postuler")
  })
})
