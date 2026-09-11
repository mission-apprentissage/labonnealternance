import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { resetSearchItemBuildContextCache } from "@/services/search/search-items.service"
import { processJobPartnersForApi, reprocessJobPartners } from "./process-job-partners-for-api"

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

  it("ne revendique pas les documents déjà pris par un run en cours", async () => {
    // Sans ce filtre, ce run réattribuerait le document et l'import du run concurrent, qui cible son
    // propre processId, ne matcherait plus rien : son travail serait perdu sans erreur.
    const autreRun = new ObjectId().toString()
    const computed = await createComputedJobPartner({
      partner_label: "Mission Apprentissage",
      partner_job_id: "api_offer_pris",
      validated: true,
      business_error: null,
      updated_at: new Date(),
      currently_processed_id: autreRun,
    })

    await processJobPartnersForApi()

    const apres = await getDbCollection("computed_jobs_partners").findOne({ _id: computed._id })
    expect.soft(apres?.currently_processed_id).toBe(autreRun)
    expect(await getDbCollection("jobs_partners").findOne({ partner_job_id: "api_offer_pris" })).toBeNull()
  })

  it("réattribue les documents laissés par un processId périmé", async () => {
    // Un run tué net (redéploiement) ne passe pas par la libération : sans échappatoire ses
    // documents resteraient revendiqués pour toujours, donc jamais publiés.
    const runMort = ObjectId.createFromTime(Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 1000)).toString()
    const computed = await createComputedJobPartner({
      partner_label: "Mission Apprentissage",
      partner_job_id: "api_offer_orphelin",
      validated: true,
      business_error: null,
      updated_at: new Date(),
      currently_processed_id: runMort,
    })

    await processJobPartnersForApi()

    expect.soft((await getDbCollection("jobs_partners").findOne({ partner_job_id: "api_offer_orphelin" }))?._id.toString()).toBe(computed._id.toString())
  })

  it("libère les documents revendiqués même quand le run échoue", async () => {
    const computed = await createComputedJobPartner({
      partner_label: "Mission Apprentissage",
      partner_job_id: "api_offer_echec",
      validated: true,
      business_error: null,
      updated_at: new Date(),
    })
    const importer = await import("./import-from-computed-to-jobs-partners")
    vi.spyOn(importer, "importFromComputedToJobsPartners").mockRejectedValueOnce(new Error("panne simulée"))

    await expect(processJobPartnersForApi()).rejects.toThrow("panne simulée")

    const apres = await getDbCollection("computed_jobs_partners").findOne({ _id: computed._id })
    expect(apres?.currently_processed_id).toBeNull()
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

  describe("reprocessJobPartners (levier d'incident CLI)", () => {
    it("refuse un filtre absent, non JSON, tableau ou vide : un filtre vide relancerait tout computed_jobs_partners", async () => {
      await expect(reprocessJobPartners()).rejects.toThrow(/--filter requis/)
      await expect(reprocessJobPartners({ filter: "{partner_label: Hellowork}" })).rejects.toThrow(/n'est pas un JSON valide/)
      await expect(reprocessJobPartners({ filter: '["Hellowork"]' })).rejects.toThrow(/objet JSON non vide/)
      await expect(reprocessJobPartners({ filter: "{}" })).rejects.toThrow(/objet JSON non vide/)
      await expect(reprocessJobPartners({ filter: "null" })).rejects.toThrow(/objet JSON non vide/)
    })

    it("relance la chaîne sur le seul périmètre du filtre : importé et indexé, le computed validé est consommé", async () => {
      const inScope = await createComputedJobPartner({
        partner_label: "Mission Apprentissage",
        partner_job_id: "reprocess_in_1",
        offer_title: "TEST SANDBOX - ne pas traiter",
        validated: true,
        business_error: null,
      })
      const outOfScope = await createComputedJobPartner({
        partner_label: "Mission Apprentissage",
        partner_job_id: "reprocess_out_1",
        offer_title: "TEST SANDBOX - ne pas traiter",
        validated: true,
        business_error: null,
      })

      await reprocessJobPartners({ filter: '{"partner_job_id":"reprocess_in_1"}' })

      expect.soft(await getDbCollection("jobs_partners").countDocuments({ partner_job_id: "reprocess_in_1" })).toBe(1)
      expect.soft(await getDbCollection("search_items").countDocuments({ _id: inScope._id })).toBe(1)
      expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ _id: inScope._id })).toBe(0)
      // Hors filtre : ni importé, ni supprimé.
      expect.soft(await getDbCollection("jobs_partners").countDocuments({ partner_job_id: "reprocess_out_1" })).toBe(0)
      expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ _id: outOfScope._id })).toBe(1)
    })
  })
})
