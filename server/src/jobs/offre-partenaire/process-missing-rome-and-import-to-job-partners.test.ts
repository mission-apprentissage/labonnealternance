import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import nock from "nock"
import type { IDiagorienteClassificationResponseSchema } from "shared"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { nockDiagorienteAccessToken, nockDiagorienteRomeClassifier } from "@/common/apis/diagoriente/diagoriente.client.fixture"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { processMissingRomeAndImportToJobPartners } from "./process-missing-rome-and-import-to-job-partners"

const now = new Date("2024-07-21T04:49:06.000+02:00")

// État d'une offre à la sortie du traitement de nuit quand le romage a échoué.
const romageEchoueAuTraitementComplet: Pick<IComputedJobsPartners, "errors" | "validated"> = {
  validated: false,
  errors: [
    { source: COMPUTED_ERROR_SOURCE.API_DIAGORIENTE, error: "data not found" },
    { source: COMPUTED_ERROR_SOURCE.VALIDATION, error: JSON.stringify("offer_rome_codes is empty") },
  ],
}

const nockRomage = (jobs: IComputedJobsPartners[], romes: string[]) => {
  const response: IDiagorienteClassificationResponseSchema = Object.fromEntries(
    jobs.map((job, index) => [
      job._id.toString(),
      {
        classify_results: [
          {
            data: {
              _key: `key-${index}`,
              item_version_id: `version-id-${index}`,
              item_id: `item-id-${index}`,
              titre: job.offer_title!,
              valid_from: "2024-01-01",
              rome: romes[index],
              valid_to: null,
              item_type: "SousDomaine",
            },
          },
        ],
      },
    ])
  )
  nockDiagorienteAccessToken()
  nockDiagorienteRomeClassifier(
    jobs.map(({ _id, offer_title, workplace_naf_label, offer_description }) => ({
      id: _id.toString(),
      title: offer_title!,
      sector: workplace_naf_label ?? "",
      description: offer_description ?? "",
    })),
    response
  )
}

describe("process-missing-rome-and-import-to-job-partners", () => {
  useMongo()

  const viderCollections = async () => {
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
    await getDbCollection("cache_diagoriente").deleteMany({})
  }

  beforeEach(async () => {
    await viderCollections()
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      nock.cleanAll()
      await viderCollections()
    }
  })

  it("ne sélectionne pas une offre fraîchement reconstruite, sans ROME, qui n'a pas encore suivi la chaîne complète", async () => {
    // Faux positif mesuré en prod (#5671) : le run de 00h00 publiait le catalogue reconstruit avant le traitement de nuit.
    await givenSomeComputedJobPartners([
      { partner_job_id: "fraiche-null", offer_rome_codes: null, errors: [], validated: false },
      { partner_job_id: "fraiche-vide", offer_rome_codes: [], errors: [], validated: false },
    ])

    const result = await processMissingRomeAndImportToJobPartners()

    expect.soft(result.selected).toBe(0)
    expect.soft(await getDbCollection("jobs_partners").countDocuments({})).toBe(0)
    const computed = await getDbCollection("computed_jobs_partners").find({}).toArray()
    for (const job of computed) {
      expect.soft(job.currently_processed_id ?? null).toBeNull()
      expect.soft(job.errors).toEqual([])
    }
  })

  it("ne sélectionne pas une offre dont le romage a échoué mais que la chaîne complète n'a pas encore validée", async () => {
    // Traitement de nuit en cours ou interrompu entre fillRomeForPartners et la validation : l'offre n'est ni
    // dédoublonnée ni rankée, c'est au rattrapage de journée de la reprendre.
    await givenSomeComputedJobPartners([
      {
        partner_job_id: "romage-echoue-non-valide",
        offer_rome_codes: null,
        errors: [{ source: COMPUTED_ERROR_SOURCE.API_DIAGORIENTE, error: "data not found" }],
      },
    ])

    const result = await processMissingRomeAndImportToJobPartners()

    expect.soft(result.selected).toBe(0)
    expect.soft(await getDbCollection("jobs_partners").countDocuments({})).toBe(0)
  })

  it("reprend, rome et publie les offres dont le romage a échoué au traitement complet", async () => {
    const computedJobs = await givenSomeComputedJobPartners([
      {
        ...romageEchoueAuTraitementComplet,
        partner_job_id: "missing-rome-null",
        offer_title: "Chef de partie, second de cuisine H/F",
        workplace_naf_label: "Commerce de détail d'habillement en magasin spécialisé",
        offer_description: "Description suffisamment longue pour etre qualifiee par Diagoriente et passer la validation finale.",
        offer_rome_codes: null,
      },
      {
        ...romageEchoueAuTraitementComplet,
        partner_job_id: "missing-rome-empty-array",
        offer_title: "Serveur en restauration H/F",
        workplace_naf_label: "Restauration traditionnelle",
        offer_description: "Une autre description suffisamment longue pour etre qualifiee par Diagoriente et etre importee.",
        offer_rome_codes: [],
      },
    ])
    nockRomage(computedJobs, ["G1602", "G1803"])

    const result = await processMissingRomeAndImportToJobPartners()

    expect.soft(result.selected).toBe(2)
    const updatedComputedJobs = await getDbCollection("computed_jobs_partners")
      .find({ partner_job_id: { $in: ["missing-rome-null", "missing-rome-empty-array"] } })
      .toArray()
    const importedJobs = await getDbCollection("jobs_partners")
      .find({ partner_job_id: { $in: ["missing-rome-null", "missing-rome-empty-array"] } })
      .toArray()

    expect.soft(updatedComputedJobs).toHaveLength(2)
    expect.soft(importedJobs).toHaveLength(2)

    for (const job of updatedComputedJobs) {
      expect.soft(job.currently_processed_id).toBeNull()
      expect.soft(job.validated).toBe(true)
      expect.soft(job.business_error).toBeNull()
      expect.soft(job.offer_rome_codes?.length).toBe(1)
      expect.soft(job.errors.filter((error) => error?.source === COMPUTED_ERROR_SOURCE.VALIDATION)).toEqual([])
    }

    for (const job of importedJobs) {
      expect.soft(job.offer_rome_codes?.length).toBe(1)
      expect.soft(job.lba_url).toBeTruthy()
    }
  })

  it("ne publie pas une offre romée sur un ROME exclu", async () => {
    // blockBadRomeJobsPartners ne voit pas les offres sans ROME pendant le traitement de nuit.
    const computedJobs = await givenSomeComputedJobPartners([
      {
        ...romageEchoueAuTraitementComplet,
        partner_job_id: "rome-exclu",
        offer_title: "Agent de nettoyage H/F",
        workplace_naf_label: "Nettoyage courant des bâtiments",
        offer_description: "Description suffisamment longue pour etre qualifiee par Diagoriente sur un ROME exclu de LBA.",
        offer_rome_codes: null,
      },
    ])
    nockRomage(computedJobs, ["K2202"])

    await processMissingRomeAndImportToJobPartners()

    const computed = await getDbCollection("computed_jobs_partners").findOne({ partner_job_id: "rome-exclu" })
    expect.soft(computed?.offer_rome_codes).toEqual(["K2202"])
    expect.soft(computed?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.ROME_BLACKLISTED)
    expect.soft(await getDbCollection("jobs_partners").countDocuments({ partner_job_id: "rome-exclu" })).toBe(0)
  })

  it("ne reprend pas une offre verrouillée par un autre traitement", async () => {
    const autreRun = new ObjectId().toString()
    await givenSomeComputedJobPartners([{ ...romageEchoueAuTraitementComplet, partner_job_id: "verrouillee", offer_rome_codes: null, currently_processed_id: autreRun }])

    const result = await processMissingRomeAndImportToJobPartners()

    expect.soft(result.selected).toBe(0)
    const computed = await getDbCollection("computed_jobs_partners").findOne({ partner_job_id: "verrouillee" })
    expect.soft(computed?.currently_processed_id).toBe(autreRun)
  })

  it("reprend une offre dont le verrou est périmé", async () => {
    const runMort = ObjectId.createFromTime(Math.floor((now.getTime() - 2 * 60 * 60 * 1000) / 1000)).toString()
    const computedJobs = await givenSomeComputedJobPartners([
      {
        ...romageEchoueAuTraitementComplet,
        partner_job_id: "verrou-perime",
        offer_title: "Boulanger H/F",
        workplace_naf_label: "Boulangerie et boulangerie-pâtisserie",
        offer_description: "Description suffisamment longue pour etre qualifiee par Diagoriente et etre importee ensuite.",
        offer_rome_codes: null,
        currently_processed_id: runMort,
      },
    ])
    nockRomage(computedJobs, ["D1102"])

    await processMissingRomeAndImportToJobPartners()

    expect.soft(await getDbCollection("jobs_partners").countDocuments({ partner_job_id: "verrou-perime" })).toBe(1)
    const computed = await getDbCollection("computed_jobs_partners").findOne({ partner_job_id: "verrou-perime" })
    expect.soft(computed?.currently_processed_id).toBeNull()
  })
})
