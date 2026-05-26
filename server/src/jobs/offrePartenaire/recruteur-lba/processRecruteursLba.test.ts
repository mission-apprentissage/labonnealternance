import fs from "node:fs"
import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import omit from "lodash-es/omit"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { generateComputedJobsPartnersFixture } from "shared/fixtures/jobPartners.fixture"
import { generateRecruiterRawFixture } from "shared/fixtures/recruiterRaw.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IRecruteursLbaRaw } from "shared/models/rawRecruteursLba.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { stringToStream } from "@/common/utils/streamUtils"
import { processRecruteursLba } from "./processRecruteursLba"

useMongo()

const now = new Date("2024-07-21T04:49:06.000+02:00")

const testDir = "server/src/jobs/offrePartenaire/recruteur-lba/__tests__"

const processRecruteursLbaFromFile = async (sourceFilePath: string) => {
  const sourceFileReadStream = fs.createReadStream(sourceFilePath)
  await processRecruteursLba({ skipCheckFileDate: true, sourceFileReadStream })
}

const processRecruteursLbaFromObjects = async (recruteursRaw: IRecruteursLbaRaw[]) => {
  const stream = stringToStream(JSON.stringify(recruteursRaw))
  await processRecruteursLba({ skipCheckFileDate: true, sourceFileReadStream: stream })
}

describe("importRecruteursLbaRaw", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    await getDbCollection("opcos").insertMany([
      {
        _id: new ObjectId(),
        siren: "808413827",
        opco: OPCOS_LABEL.ATLAS,
        idcc: 1000,
      },
      {
        _id: new ObjectId(),
        siren: "130025265",
        opco: OPCOS_LABEL.ATLAS,
        idcc: 1000,
      },
    ])

    return async () => {
      vi.useRealTimers()
      await getDbCollection("opcos").deleteMany({})
      await getDbCollection("unsubscribedrecruteurslba").deleteMany({})
      await getDbCollection("emailblacklists").deleteMany({})

      await getDbCollection("raw_recruteurslba").deleteMany({})
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("should process all recruteurs", async () => {
    await processRecruteursLbaFromFile(`${testDir}/processRecruteursLba.test.1.json`)
    const publishedJobPartners = await getDbCollection("jobs_partners").find({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }).sort({ partner_job_id: 1 }).toArray()
    expect.soft(publishedJobPartners.map((job) => omit(job, "_id"))).toMatchSnapshot()
  })

  it("should remove existing recruteurs in job_partners that are not in the file", async () => {
    // given
    await createJobPartner({
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    })
    expect.soft((await getDbCollection("jobs_partners").find({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }).toArray()).length).toBe(1)

    // when
    await processRecruteursLbaFromFile(`${testDir}/processRecruteursLba.test.1.json`)
    // then
    const jobs = await getDbCollection("jobs_partners").find({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }).toArray()

    const activeJobs = jobs.filter((x) => x.offer_status === JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(activeJobs.length).toBe(2)

    const canceledJobs = jobs.filter((x) => x.offer_status === JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(canceledJobs.length).toBe(1)
    const [canceledJob] = canceledJobs
    expect.soft(canceledJob.offer_status_history.map(({ status }) => ({ status }))).toEqual([{ status: JOB_STATUS_ENGLISH.ANNULEE }])
  })
  it("should remove email contact when it is blacklisted", async () => {
    // given
    const email = "roget@dinum.fr"
    await getDbCollection("emailblacklists").insertOne({
      _id: new ObjectId(),
      created_at: new Date(),
      email,
      blacklisting_origin: "test",
    })

    // when
    await processRecruteursLbaFromObjects([generateRecruiterRawFixture({ email })])
    // then
    const publishedJobPartners = await getDbCollection("jobs_partners").find({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }).toArray()
    expect.soft(publishedJobPartners.length).toBe(1)
    const [job] = publishedJobPartners
    expect.soft(job.apply_email).toBe(null)
  })

  it("should refresh raw recruiter fields when computed document already exists", async () => {
    const rawRecruiter = generateRecruiterRawFixture({
      siret: "13002526500013",
      enseigne: "ETABLISSEMENTS DINUM",
      raison_sociale: "ETABLISSEMENTS DINUM",
    })
    const originalCreatedAt = new Date("2020-01-01")

    await getDbCollection("computed_jobs_partners").insertOne(
      generateComputedJobsPartnersFixture({
        _id: new ObjectId(),
        partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        partner_job_id: rawRecruiter.siret,
        workplace_siret: rawRecruiter.siret,
        workplace_brand: "ANCIEN NOM",
        workplace_legal_name: "ANCIEN NOM",
        created_at: originalCreatedAt,
      })
    )

    await processRecruteursLbaFromObjects([rawRecruiter])

    const computedRecruiter = await getDbCollection("computed_jobs_partners").findOne({
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      workplace_siret: rawRecruiter.siret,
    })
    const publishedRecruiter = await getDbCollection("jobs_partners").findOne({
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      partner_job_id: rawRecruiter.siret,
    })

    expect.soft(computedRecruiter?.workplace_brand).toBe(rawRecruiter.enseigne)
    expect.soft(computedRecruiter?.workplace_legal_name).toBe(rawRecruiter.raison_sociale)
    expect.soft(computedRecruiter?.created_at).toEqual(originalCreatedAt)
    expect.soft(publishedRecruiter?.workplace_brand).toBe(rawRecruiter.enseigne)
    expect.soft(publishedRecruiter?.workplace_legal_name).toBe(rawRecruiter.raison_sociale)
  })

  it("should not update a computed document with the same siret but a different partner_label", async () => {
    const siret = "13002526500013"
    const rawRecruiter = generateRecruiterRawFixture({ siret, enseigne: "NOUVEAU NOM" })
    const otherPartnerBrand = "AUTRE PARTENAIRE"

    await getDbCollection("computed_jobs_partners").insertOne(
      generateComputedJobsPartnersFixture({
        _id: new ObjectId(),
        partner_label: JOBPARTNERS_LABEL.HELLOWORK,
        partner_job_id: "hellowork-job-42",
        workplace_siret: siret,
        workplace_brand: otherPartnerBrand,
      })
    )

    await processRecruteursLbaFromObjects([rawRecruiter])

    const otherPartnerDoc = await getDbCollection("computed_jobs_partners").findOne({
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      workplace_siret: siret,
    })

    expect.soft(otherPartnerDoc?.workplace_brand).toBe(otherPartnerBrand)
  })

  it("should not import recruiters that opted out", async () => {
    // given
    const siret = "13002526500013"
    await getDbCollection("unsubscribedrecruteurslba").insertOne({
      _id: new ObjectId(),
      siret,
      raison_sociale: "DINUM",
      enseigne: "",
      naf_code: "",
      naf_label: "",
      rome_codes: [],
      insee_city_code: null,
      zip_code: null,
      city: null,
      company_size: null,
      created_at: new Date(),
      last_update_at: new Date(),
      unsubscribe_date: new Date(),
      unsubscribe_reason: "raison",
    })

    // when
    await processRecruteursLbaFromObjects([generateRecruiterRawFixture({ siret })])
    // then
    const publishedJobPartners = await getDbCollection("jobs_partners").find({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }).toArray()
    expect.soft(publishedJobPartners.length).toBe(0)
  })
})
