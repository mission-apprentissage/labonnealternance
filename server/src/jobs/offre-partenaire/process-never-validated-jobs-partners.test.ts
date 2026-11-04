import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { fillComputedJobsPartners } from "./fill-computed-jobs-partners"
import { processNeverValidatedJobPartners } from "./process-never-validated-jobs-partners"

// Enrichissement neutralisé (API externes), validation réelle : c'est elle qui décide de la reprise.
vi.mock("./fill-computed-jobs-partners", async (importOriginal) => {
  const { validateComputedJobPartners } = await import("./validate-computed-job-partners")
  return {
    ...(await importOriginal<typeof import("./fill-computed-jobs-partners")>()),
    fillComputedJobsPartners: vi.fn(async (context) => ({ validateComputedJobPartners: await validateComputedJobPartners(context) })),
  }
})

const HOUR = 60 * 60 * 1000
const reconstruiteCetteNuit = () => new Date(Date.now() - 6 * HOUR)

const enrichieJamaisExaminee = (partner_job_id: string) => ({
  partner_label: JOBPARTNERS_LABEL.HELLOWORK,
  partner_job_id,
  offer_rome_codes: ["M1602"],
  validated: false,
  business_error: null,
  errors: [],
  created_at: reconstruiteCetteNuit(),
})

describe("processNeverValidatedJobPartners", () => {
  useMongo()

  const viderCollections = async () => {
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  }

  beforeEach(async () => {
    await viderCollections()
    vi.mocked(fillComputedJobsPartners).mockClear()
    return viderCollections
  })

  it("publie une offre enrichie que la validation n'a jamais examinée, sans supprimer le computed ni annuler d'offre", async () => {
    const computed = await createComputedJobPartner(enrichieJamaisExaminee("jamais-examinee"))
    const horsComputed = await createJobPartner({
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      partner_job_id: "absente-du-computed",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    })

    const result = await processNeverValidatedJobPartners()

    expect.soft(result.selected).toBe(1)
    expect.soft(vi.mocked(fillComputedJobsPartners)).toHaveBeenCalledWith({ addedMatchFilter: { currently_processed_id: expect.any(String) } })
    const jobPartner = await getDbCollection("jobs_partners").findOne({ partner_job_id: "jamais-examinee" })
    expect.soft(jobPartner?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(jobPartner?.lba_url).toBeTruthy()
    const apres = await getDbCollection("computed_jobs_partners").findOne({ _id: computed._id })
    expect.soft(apres?.validated).toBe(true)
    expect.soft(apres?.currently_processed_id).toBeNull()
    expect.soft((await getDbCollection("jobs_partners").findOne({ _id: horsComputed._id }))?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
  })

  it("ne reprend pas en boucle une offre en erreur de validation réelle", async () => {
    // Champ réellement manquant : aucun enrichissement ne le remplira, la reprise ne doit pas se répéter.
    await createComputedJobPartner({ ...enrichieJamaisExaminee("titre-manquant"), offer_title: null })

    const premier = await processNeverValidatedJobPartners()
    const apresPremier = await getDbCollection("computed_jobs_partners").findOne({ partner_job_id: "titre-manquant" })
    const second = await processNeverValidatedJobPartners()

    expect.soft(premier.selected).toBe(1)
    expect.soft(apresPremier?.validated).toBe(false)
    expect.soft(apresPremier?.errors.map((error) => error?.source)).toContain(COMPUTED_ERROR_SOURCE.VALIDATION)
    expect.soft(second.selected).toBe(0)
    expect.soft(vi.mocked(fillComputedJobsPartners)).toHaveBeenCalledTimes(1)
    expect.soft(await getDbCollection("jobs_partners").countDocuments({ partner_job_id: "titre-manquant" })).toBe(0)
  })

  it("ne reprend pas une offre verrouillée par un autre traitement", async () => {
    const autreRun = new ObjectId().toString()
    await createComputedJobPartner({ ...enrichieJamaisExaminee("verrouillee"), currently_processed_id: autreRun })

    const result = await processNeverValidatedJobPartners()

    expect.soft(result.selected).toBe(0)
    expect.soft((await getDbCollection("computed_jobs_partners").findOne({ partner_job_id: "verrouillee" }))?.currently_processed_id).toBe(autreRun)
    expect.soft(await getDbCollection("jobs_partners").countDocuments({ partner_job_id: "verrouillee" })).toBe(0)
  })

  it("reprend une offre dont le verrou est périmé", async () => {
    const runMort = ObjectId.createFromTime(Math.floor((Date.now() - 2 * HOUR) / 1000)).toString()
    await createComputedJobPartner({ ...enrichieJamaisExaminee("verrou-perime"), currently_processed_id: runMort })

    const result = await processNeverValidatedJobPartners()

    expect.soft(result.selected).toBe(1)
    expect.soft(await getDbCollection("jobs_partners").countDocuments({ partner_job_id: "verrou-perime" })).toBe(1)
  })

  it("ne reprend pas une offre que le traitement qui l'a reconstruite n'a pas eu le temps de finir", async () => {
    await createComputedJobPartner({ ...enrichieJamaisExaminee("fraiche"), created_at: new Date(Date.now() - 30 * 60 * 1000) })

    const result = await processNeverValidatedJobPartners()

    expect.soft(result.selected).toBe(0)
    expect.soft(vi.mocked(fillComputedJobsPartners)).not.toHaveBeenCalled()
  })

  it("ne reprend ni une offre bloquée, ni une offre en échec d'import, ni une offre validée, ni une offre hors flux", async () => {
    await createComputedJobPartner({ ...enrichieJamaisExaminee("bloquee"), business_error: JOB_PARTNER_BUSINESS_ERROR.DUPLICATE })
    await createComputedJobPartner({ ...enrichieJamaisExaminee("echec-import"), errors: [{ source: COMPUTED_ERROR_SOURCE.DB_ERROR, error: "écriture refusée" }] })
    await createComputedJobPartner({ ...enrichieJamaisExaminee("validee"), validated: true })
    await createComputedJobPartner({ ...enrichieJamaisExaminee("api"), partner_label: "Mission Apprentissage" })

    const result = await processNeverValidatedJobPartners()

    expect.soft(result.selected).toBe(0)
    expect.soft(await getDbCollection("jobs_partners").countDocuments({})).toBe(0)
  })
})
