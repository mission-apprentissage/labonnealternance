import { badRequest, notFound } from "@hapi/boom"
import { jobFactory, mockReferentielRome } from "@tests/utils/job.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveRecruiter } from "@tests/utils/user.test.utils"
import { ObjectId } from "bson"
import dayjs from "dayjs"
import { RECRUITER_STATUS } from "shared/constants"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { JOB_STATUS } from "shared/models"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { sendApplicationV2 } from "./application.service"

useMongo()

const fakeApplication = {
  applicant_first_name: "a",
  applicant_last_name: "a",
  applicant_email: "test@test.fr",
  applicant_phone: "0125252525",
  message: "some blahblahblah",
  applicant_file_name: "cv.pdf",
  applicant_file_content: "aaa",
}
describe("Sending application", () => {
  beforeEach(async () => {
    // await saveRecruiter({
    //   status: RECRUITER_STATUS.ACTIF,
    //   jobs: [
    //     jobFactory({
    //       _id: new ObjectId("6081289803569600282e0001"),
    //       rome_code: ["A1101"],
    //     }),
    //   ],
    // })

    const datePlus1 = dayjs().add(1, "day")

    await saveRecruiter({
      status: RECRUITER_STATUS.ARCHIVE,
      jobs: [
        jobFactory({
          _id: new ObjectId("6081289803569600282e0002"),
          rome_code: ["A1101"],
          job_expiration_date: datePlus1.toDate(),
        }),
      ],
    })

    await saveRecruiter({
      status: RECRUITER_STATUS.ACTIF,
      jobs: [
        jobFactory({
          _id: new ObjectId("6081289803569600282e0003"),
          rome_code: ["A1101"],
          job_status: JOB_STATUS.POURVUE,
          job_expiration_date: datePlus1.toDate(),
        }),
      ],
    })

    await mockReferentielRome()
    return async () => {
      await getDbCollection("recruiters").deleteMany({})
      await getDbCollection("referentielromes").deleteMany({})
    }
  })
  it("Should refuse sending application to non existent job", async () => {
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          job_id: "6081289803569600282e0000",
        },
      })
    ).rejects.toThrow(notFound(BusinessErrorCodes.NOTFOUND))
  })

  // it("Should refuse sending application to expired job because of expiry date", async () => {
  //   await expect(
  //     sendApplicationV2({
  //       newApplication: {
  //         ...fakeApplication,
  //         job_id: "6081289803569600282e0001",
  //       },
  //     })
  //   ).rejects.toThrow(badRequest(BusinessErrorCodes.EXPIRED))
  // })

  it("Should refuse sending application to expired job because of recruiter status", async () => {
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          job_id: "6081289803569600282e0002",
        },
      })
    ).rejects.toThrow(badRequest(BusinessErrorCodes.EXPIRED))
  })

  it("Should refuse sending application to expired job because of job status", async () => {
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          job_id: "6081289803569600282e0003",
        },
      })
    ).rejects.toThrow(badRequest(BusinessErrorCodes.EXPIRED))
  })

  it("Should refuse sending application to non existent company", async () => {
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          company_siret: "34843069553553",
        },
      })
    ).rejects.toThrow(notFound(BusinessErrorCodes.NOTFOUND))
  })
})