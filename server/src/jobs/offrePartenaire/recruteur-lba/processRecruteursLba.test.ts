import fs from "node:fs"

import omit from "lodash-es/omit"
import { ObjectId } from "mongodb"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IRecruteursLbaRaw } from "shared/models/rawRecruteursLba.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { stringToStream } from "@/common/utils/streamUtils"
import { processRecruteursLba } from "@/jobs/offrePartenaire/recruteur-lba/processRecruteursLba"
import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { generateRecruiterRawFixture } from "../../../../../shared/src/fixtures/recruiterRaw.fixture"

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
    vi.useFakeTimers()
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
    const publishedJobPartners = await getDbCollection("jobs_partners").find({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }).toArray()
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
    const publishedJobPartners = await getDbCollection("jobs_partners").find({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }).toArray()
    expect.soft(publishedJobPartners.length).toBe(2)
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
