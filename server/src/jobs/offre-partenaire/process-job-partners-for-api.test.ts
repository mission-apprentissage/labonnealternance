import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { resetSearchItemBuildContextCache } from "@/services/search/search-items.service"
import * as fillComputedJobsPartnersModule from "./fill-computed-jobs-partners"
import { processJobPartnersForApi, processJobPartnersWithFilter } from "./process-job-partners-for-api"

// fillComputedJobsPartners neutralisé : ses étapes appellent les API externes (SIRET, ROME,
// classification) et ne sont pas le sujet ici — les documents du test sont déjà validés. Le reste
// de la chaîne (import vers jobs_partners puis indexation search_items) tourne pour de vrai.
// clearMocks: true (vitest.config.ts) réinitialise l'historique d'appels avant chaque test.
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

  it("n'indexe pas ce qu'un autre job écrit pendant le run", async () => {
    // Garde-fou du ciblage par _id : une borne `updated_at` absorberait tout ce que l'expiration,
    // le dédoublonnage ou un import de flux écrit en parallèle, et ce cron hériterait de leur
    // volume (jusqu'à 4 min mesurées sur le cron delta pendant les imports nocturnes).
    const autreJob = await createJobPartner({
      partner_job_id: "ecrit_par_un_autre_job",
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      updated_at: new Date(),
    })

    await createComputedJobPartner({
      partner_label: "Mission Apprentissage",
      partner_job_id: "api_offer_3",
      validated: true,
      business_error: null,
      updated_at: new Date(),
    })

    await processJobPartnersForApi()

    expect.soft(await getDbCollection("search_items").countDocuments({ _id: autreJob._id })).toBe(0)
    // L'offre du run, elle, est bien indexée.
    const importee = await getDbCollection("jobs_partners").findOne({ partner_job_id: "api_offer_3" })
    expect.soft(await getDbCollection("search_items").countDocuments({ _id: importee!._id })).toBe(1)
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

  it("appelle fillComputedJobsPartners avec skipCfaAndClassificationDetection à true : les offres reçues via l'API sont certifiées conformes par le partenaire, ces deux contrôles sont redondants pour ce flux", async () => {
    await processJobPartnersForApi()

    expect(fillComputedJobsPartnersModule.fillComputedJobsPartners).toHaveBeenCalledTimes(1)
    const [context] = vi.mocked(fillComputedJobsPartnersModule.fillComputedJobsPartners).mock.calls[0]
    expect(context).toMatchObject({ skipCfaAndClassificationDetection: true })
  })
})

describe("processJobPartnersWithFilter", () => {
  useMongo()

  it("n'active pas skipCfaAndClassificationDetection : ce flux ne bénéficie pas de la garantie de conformité de l'API", async () => {
    await processJobPartnersWithFilter({})

    expect(fillComputedJobsPartnersModule.fillComputedJobsPartners).toHaveBeenCalledTimes(1)
    const [context] = vi.mocked(fillComputedJobsPartnersModule.fillComputedJobsPartners).mock.calls[0]
    expect(context?.skipCfaAndClassificationDetection).toBeUndefined()
  })
})
