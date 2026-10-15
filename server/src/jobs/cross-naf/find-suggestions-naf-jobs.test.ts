import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

import { findSuggestionsNafJobs } from "./find-suggestions-naf-jobs"
import type { SuggestionsNafApplicantWithTargets, SuggestionsNafTarget } from "./find-suggestions-naf-targets"

const point = (longitude: number, latitude: number) => ({ type: "Point" as const, coordinates: [longitude, latitude] as [number, number] })
const PARIS = point(2.347, 48.859)
const VERSAILLES = point(2.13, 48.804)
const MEAUX = point(2.878, 48.96)
const ORLEANS = point(1.909, 47.902)

const sector = (naf: string, rang: number) => ({ naf, naf_libelle: `libellé ${naf}`, rang, contrats_par_annee: [] })

const buildTarget = (rome: string, nafs: string[]): SuggestionsNafTarget => ({
  rome,
  rome_libelle: `libellé ${rome}`,
  source_application_id: new ObjectId(),
  source_geopoint: PARIS,
  sectors: nafs.map((naf, index) => sector(naf, index + 2)),
})

const buildApplicant = (targets: SuggestionsNafTarget[], appliedJobIds: ObjectId[] = []): SuggestionsNafApplicantWithTargets => ({
  _id: new ObjectId(),
  email: "candidat@example.com",
  firstname: "Camille",
  applications: appliedJobIds.map((job_id) => ({ _id: new ObjectId(), job_id, job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA })),
  targets,
})

const createJob = async (data: Partial<IJobsPartnersOfferPrivate>) => {
  const job = generateJobsPartnersOfferPrivate({
    offer_rome_codes: ["A1101"],
    workplace_naf_code: "01.11Z",
    workplace_geopoint: PARIS,
    apply_email: "recrutement@example.com",
    ...data,
  })
  await getDbCollection("jobs_partners").insertOne(job)
  return job._id
}

const findSuggestedJobIds = async (applicant: SuggestionsNafApplicantWithTargets) => {
  const [{ targets }] = await findSuggestionsNafJobs([applicant])
  return targets.map(({ suggestions }) => suggestions.map(({ sector, job }) => ({ naf: sector.naf, job_id: job._id })))
}

describe("findSuggestionsNafJobs", () => {
  useMongo()

  it("privilégie les offres LBA, puis partenaires, puis recruteurs LBA, quelle que soit la distance", async () => {
    await createJob({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, offer_expiration: null, workplace_geopoint: PARIS })
    await createJob({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, workplace_geopoint: VERSAILLES })
    const lbaJob = await createJob({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, workplace_geopoint: MEAUX })

    const [{ targets }] = await findSuggestionsNafJobs([buildApplicant([buildTarget("A1101", ["01.11Z"])])])

    expect(targets[0].suggestions).toEqual([
      {
        sector: sector("01.11Z", 2),
        job: expect.objectContaining({ _id: lbaJob, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, distance_km: expect.closeTo(40, -1) }),
      },
    ])
  })

  it("départage les offres de même priorité par la distance à la candidature source", async () => {
    await createJob({ workplace_geopoint: MEAUX })
    const nearest = await createJob({ workplace_geopoint: VERSAILLES })

    expect(await findSuggestedJobIds(buildApplicant([buildTarget("A1101", ["01.11Z"])]))).toEqual([[{ naf: "01.11Z", job_id: nearest }]])
  })

  it("retient un recruteur LBA quand le secteur n'a pas d'autre offre", async () => {
    const recruteur = await createJob({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, offer_expiration: null })

    expect(await findSuggestedJobIds(buildApplicant([buildTarget("A1101", ["01.11Z"])]))).toEqual([[{ naf: "01.11Z", job_id: recruteur }]])
  })

  it("écarte les offres sans email, déjà candidatées, expirées, inactives, à plus de 100 km ou sur un autre ROME", async () => {
    await createJob({ apply_email: null })
    const applied = await createJob({})
    await createJob({ offer_expiration: new Date("2020-01-01") })
    await createJob({ offer_status: JOB_STATUS_ENGLISH.ANNULEE })
    await createJob({ workplace_geopoint: ORLEANS })
    await createJob({ offer_rome_codes: ["M1607"] })

    expect(await findSuggestedJobIds(buildApplicant([buildTarget("A1101", ["01.11Z"])], [applied]))).toEqual([[]])
  })

  it("ordonne les suggestions par rang du secteur et saute les secteurs sans offre", async () => {
    const vigne = await createJob({ workplace_naf_code: "01.21Z" })
    const cultures = await createJob({ workplace_naf_code: "01.61Z" })

    expect(await findSuggestedJobIds(buildApplicant([buildTarget("A1101", ["01.61Z", "01.11Z", "01.21Z"])]))).toEqual([
      [
        { naf: "01.61Z", job_id: cultures },
        { naf: "01.21Z", job_id: vigne },
      ],
    ])
  })

  it("ne suggère pas deux fois la même offre à un candidat", async () => {
    const multiRome = await createJob({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, offer_expiration: null, offer_rome_codes: ["A1101", "A1416"] })

    expect(await findSuggestedJobIds(buildApplicant([buildTarget("A1101", ["01.11Z"]), buildTarget("A1416", ["01.11Z"])]))).toEqual([[{ naf: "01.11Z", job_id: multiRome }], []])
  })
})
