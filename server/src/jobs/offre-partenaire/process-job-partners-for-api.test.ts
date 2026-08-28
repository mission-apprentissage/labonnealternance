import { createComputedJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { resetSearchItemBuildContextCache } from "@/services/search/search-items.service"
import { processJobPartnersForApi } from "./process-job-partners-for-api"

// fillComputedJobsPartners neutralisé : ses étapes appellent les API externes (SIRET, ROME,
// classification) et ne sont pas le sujet ici — les documents du test sont déjà validés. Le reste
// de la chaîne (import vers jobs_partners puis indexation search_items) tourne pour de vrai.
vi.mock("./fill-computed-jobs-partners", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./fill-computed-jobs-partners")>()),
  fillComputedJobsPartners: vi.fn(async () => ({})),
}))

describe("process-job-partners-for-api", () => {
  useMongo()

  beforeEach(() => {
    resetSearchItemBuildContextCache()
    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("search_items").deleteMany({})
    }
  })

  it("indexe dans search_items les offres importées, sans attendre le cron delta", async () => {
    const computed = await createComputedJobPartner({
      partner_label: "Mission Apprentissage",
      partner_job_id: "api_offer_1",
      offer_title: "TEST SANDBOX - ne pas traiter",
      validated: true,
      business_error: null,
      updated_at: new Date(),
    })

    await processJobPartnersForApi()

    const jobPartner = await getDbCollection("jobs_partners").findOne({ partner_job_id: "api_offer_1" })
    expect.soft(jobPartner?._id.toString()).toBe(computed._id.toString())
    expect.soft(jobPartner?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)

    // Le _id est conservé de bout en bout : computed_jobs_partners → jobs_partners → search_items.
    const searchItem = await getDbCollection("search_items").findOne({ _id: computed._id })
    expect.soft(searchItem?.type).toBe("offre")
    expect.soft(searchItem?.title).toBe("TEST SANDBOX - ne pas traiter")
  })

  it("n'indexe pas les offres que l'import a écartées", async () => {
    // Near-miss : un document non validé traverse le même run sans être importé ni indexé.
    const computed = await createComputedJobPartner({
      partner_label: "Mission Apprentissage",
      partner_job_id: "api_offer_2",
      validated: false,
      business_error: null,
      updated_at: new Date(),
    })

    await processJobPartnersForApi()

    expect.soft(await getDbCollection("jobs_partners").countDocuments({ partner_job_id: "api_offer_2" })).toBe(0)
    expect.soft(await getDbCollection("search_items").countDocuments({ _id: computed._id })).toBe(0)
  })
})
