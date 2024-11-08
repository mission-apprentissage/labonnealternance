import { randomUUID } from "node:crypto"

import { ObjectId } from "bson"

import { RECRUITER_STATUS, TRAINING_CONTRACT_TYPE } from "../constants"
import { IJob, IRecruiter, JOB_STATUS } from "../models"

export function generateJobFixture(data: Partial<IJob>): IJob {
  return {
    _id: new ObjectId(),
    job_start_date: new Date("2021-01-28T15:00:00.000Z"),
    rome_code: [],
    job_status: JOB_STATUS.ACTIVE,
    job_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE],
    is_multi_published: true,
    is_disabled_elligible: null,
    job_count: 1,
    ...data,
  }
}

type RecruiterFixtureInput = Partial<
  Omit<IRecruiter, "jobs"> & {
    jobs: Partial<IJob>[]
  }
>

export function generateRecruiterFixture(data: RecruiterFixtureInput): IRecruiter {
  return {
    _id: new ObjectId(),
    establishment_id: "xxxx-xxxx-xxxx-xxxx",
    establishment_siret: "11000001500013",
    email: `stages-${randomUUID()}@mail.com`,
    is_delegated: false,
    opco: null,
    idcc: null,
    status: RECRUITER_STATUS.ACTIF,
    createdAt: new Date("2021-01-28T15:00:00.000Z"),
    updatedAt: new Date("2021-02-03T17:00:00.000Z"),
    ...data,
    jobs: data.jobs ? data.jobs.map((job) => generateJobFixture(job)) : [generateJobFixture({})],
  }
}
