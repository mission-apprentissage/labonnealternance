import { randomUUID } from "node:crypto"

import { ObjectId } from "bson"

import { RECRUITER_STATUS, TRAINING_CONTRACT_TYPE } from "../constants/recruteur.js"
import { IJob, JOB_STATUS } from "../models/job.model.js"
import { IRecruiter } from "../models/recruiter.model.js"

export function generateJobFixture(data: Partial<IJob>): IJob {
  return {
    _id: new ObjectId(),
    job_start_date: new Date("2021-01-28T15:00:00.000Z"),
    rome_code: ["M1602"], // linked by default to generateReferentielRome
    job_status: JOB_STATUS.ACTIVE,
    job_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE],
    is_disabled_elligible: null,
    job_count: 1,
    mer_sent: null,
    ...data,
  }
}

type RecruiterFixtureInput = Partial<
  Omit<IRecruiter, "jobs"> & {
    jobs: Partial<IJob>[]
  }
>

export function generateRecruiterFixture(data: RecruiterFixtureInput = {}): IRecruiter {
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
    address_detail: {
      numero_voie: "15",
      type_voie: "RUE",
      nom_voie: "DES LOUPS",
      complement_adresse: null,
      code_postal: "75002",
      localite: "PARIS",
      code_insee_localite: "75002",
      cedex: null,
      acheminement_postal: {
        l1: null,
        l2: null,
        l3: null,
        l4: "15 RUE DES LOUPS",
        l5: null,
        l6: "75002 PARIS",
        l7: "FRANCE",
      },
    },
    ...data,
    jobs: data.jobs ? data.jobs.map((job) => generateJobFixture(job)) : [generateJobFixture({})],
  }
}
