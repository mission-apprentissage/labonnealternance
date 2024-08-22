import { ObjectId } from "bson"

import { RECRUITER_STATUS, TRAINING_CONTRACT_TYPE } from "../constants"
import { IJob, IRecruiter, JOB_STATUS } from "../models"

import { getFixtureValue } from "./fixture_helper"

export function generateJobFixture(data: Partial<IJob>): IJob {
  return {
    _id: getFixtureValue(data, "_id", new ObjectId()),
    job_start_date: getFixtureValue(data, "job_start_date", new Date("2021-01-28T15:00:00.000Z")),
    rome_code: getFixtureValue(data, "rome_code", ["M1602"]),
    job_status: getFixtureValue(data, "job_status", JOB_STATUS.ACTIVE),
    job_type: getFixtureValue(data, "job_type", [TRAINING_CONTRACT_TYPE.APPRENTISSAGE]),
    is_multi_published: getFixtureValue(data, "is_multi_published", true),
    is_disabled_elligible: getFixtureValue(data, "is_disabled_elligible", false),
    job_count: getFixtureValue(data, "job_count", 1),
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
    _id: getFixtureValue(data, "_id", new ObjectId()),
    establishment_id: getFixtureValue(data, "establishment_id", "xxxx-xxxx-xxxx-xxxx"),
    establishment_siret: getFixtureValue(data, "establishment_siret", "11000001500013"),
    email: getFixtureValue(data, "email", "stages@mail.com"),
    is_delegated: getFixtureValue(data, "is_delegated", false),
    status: getFixtureValue(data, "status", RECRUITER_STATUS.ACTIF),
    createdAt: getFixtureValue(data, "createdAt", new Date("2021-01-28T15:00:00.000Z")),
    updatedAt: getFixtureValue(data, "updatedAt", new Date("2021-02-03T17:00:00.000Z")),
    ...data,
    jobs: data.jobs ? data.jobs.map((job) => generateJobFixture(job)) : [generateJobFixture({})],
  }
}
