import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

import type { SuggestionsNafApplicant } from "./find-suggestions-naf-applicants"
import { findSuggestionsNafTargets } from "./find-suggestions-naf-targets"

const { OFFRES_EMPLOI_LBA, OFFRES_EMPLOI_PARTENAIRES, RECRUTEURS_LBA } = LBA_ITEM_TYPE

const PARIS = { type: "Point" as const, coordinates: [2.347, 48.859] as [number, number] }
const LYON = { type: "Point" as const, coordinates: [4.835, 45.764] as [number, number] }

const ROME_NAFS = {
  A1101: ["01.61Z", "01.11Z", "01.21Z", "01.50Z", "78.30Z", "01.13Z", "77.31Z", "01.24Z", "01.19Z"],
  M1607: ["69.10Z", "85.59A"],
}

const seedReferentiel = async () => {
  const now = new Date()
  await getDbCollection("referentiel_rome_naf").insertMany(
    Object.entries(ROME_NAFS).flatMap(([rome, nafs]) =>
      nafs.map((naf, index) => ({
        _id: new ObjectId(),
        rome,
        rome_libelle: `libellé ${rome}`,
        naf,
        naf_libelle: `libellé ${naf}`,
        rang: index + 1,
        contrats_par_annee: [{ annee: 2025, n_contrats: 10 }],
        created_at: now,
        updated_at: now,
      }))
    )
  )
}

const createJob = async (rome_codes: string[], naf: string | null, geopoint = PARIS) => {
  const job = generateJobsPartnersOfferPrivate({ offer_rome_codes: rome_codes, workplace_naf_code: naf, workplace_geopoint: geopoint })
  await getDbCollection("jobs_partners").insertOne(job)
  return job._id
}

const buildApplicant = (applications: { job_id: ObjectId | null; job_origin: LBA_ITEM_TYPE }[]): SuggestionsNafApplicant => ({
  _id: new ObjectId(),
  email: "candidat@example.com",
  firstname: "Camille",
  lastname: "Martin",
  applications: applications.map(({ job_id, job_origin }) => ({ _id: new ObjectId(), job_id, job_origin })),
})

const summarize = async (applicant: SuggestionsNafApplicant) => {
  const [{ targets }] = await findSuggestionsNafTargets([applicant])
  return targets.map(({ rome, sectors }) => ({ rome, nafs: sectors.map(({ naf }) => naf) }))
}

describe("findSuggestionsNafTargets", () => {
  useMongo()

  beforeEach(async () => {
    await seedReferentiel()
  })

  it("propose les 5 meilleurs rangs du ROME candidaté, hors NAF de la candidature", async () => {
    const applicant = buildApplicant([{ job_id: await createJob(["A1101"], "01.11Z"), job_origin: OFFRES_EMPLOI_LBA }])

    const [{ targets }] = await findSuggestionsNafTargets([applicant])

    expect(targets).toEqual([
      {
        rome: "A1101",
        rome_libelle: "libellé A1101",
        source_application_id: applicant.applications[0]._id,
        source_geopoint: PARIS,
        sectors: ["01.61Z", "01.21Z", "01.50Z", "78.30Z", "01.13Z"].map((naf) => ({
          naf,
          naf_libelle: `libellé ${naf}`,
          rang: ROME_NAFS.A1101.indexOf(naf) + 1,
          contrats_par_annee: [{ annee: 2025, n_contrats: 10 }],
        })),
      },
    ])
  })

  it("prépare un email par ROME candidaté, en ne retenant que le 1er ROME de chaque offre", async () => {
    const applicant = buildApplicant([
      { job_id: await createJob(["M1607", "A1101"], "69.10Z"), job_origin: OFFRES_EMPLOI_PARTENAIRES },
      { job_id: await createJob(["A1101"], "01.61Z"), job_origin: OFFRES_EMPLOI_LBA },
    ])

    expect(await summarize(applicant)).toEqual([
      { rome: "M1607", nafs: ["85.59A"] },
      { rome: "A1101", nafs: ["01.11Z", "01.21Z", "01.50Z", "78.30Z", "01.13Z"] },
    ])
  })

  it("regroupe les candidatures d'un même ROME : la 1re est la source, tous leurs NAF sont exclus", async () => {
    const applicant = buildApplicant([
      { job_id: await createJob(["A1101"], "01.61Z", LYON), job_origin: OFFRES_EMPLOI_LBA },
      { job_id: await createJob(["A1101"], "01.11Z", PARIS), job_origin: OFFRES_EMPLOI_LBA },
      { job_id: await createJob(["A1101"], null, PARIS), job_origin: OFFRES_EMPLOI_PARTENAIRES },
    ])

    const [{ targets }] = await findSuggestionsNafTargets([applicant])

    expect(targets).toHaveLength(1)
    expect(targets[0]).toMatchObject({ source_application_id: applicant.applications[0]._id, source_geopoint: LYON })
    expect(targets[0].sectors.map(({ naf }) => naf)).toEqual(["01.21Z", "01.50Z", "78.30Z", "01.13Z", "77.31Z"])
  })

  it("ignore les candidatures spontanées, les offres introuvables et les ROME absents du référentiel", async () => {
    const applicant = buildApplicant([
      { job_id: await createJob(["A1101"], "01.61Z"), job_origin: RECRUTEURS_LBA },
      { job_id: new ObjectId(), job_origin: OFFRES_EMPLOI_LBA },
      { job_id: await createJob(["Z9999"], "01.61Z"), job_origin: OFFRES_EMPLOI_LBA },
    ])

    expect(await summarize(applicant)).toEqual([])
  })

  it("n'envoie rien sur un ROME dont tous les NAF ont été candidatés", async () => {
    const applicant = buildApplicant([
      { job_id: await createJob(["M1607"], "69.10Z"), job_origin: OFFRES_EMPLOI_LBA },
      { job_id: await createJob(["M1607"], "85.59A"), job_origin: OFFRES_EMPLOI_LBA },
    ])

    expect(await summarize(applicant)).toEqual([])
  })
})
