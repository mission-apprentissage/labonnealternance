import { ObjectId } from "bson"
import { Filter, MatchKeysAndValues } from "mongodb"
import { IApplicant, IApplicantNew } from "shared"

import { getDbCollection } from "../common/utils/mongodbUtils"

export const getApplicantFromDB = (filter: Filter<IApplicant>) => getDbCollection("applicants").findOne(filter)

const updateApplicant = (applicantId: ObjectId, update: MatchKeysAndValues<IApplicant>) => getDbCollection("applicants").updateOne({ _id: applicantId }, { $set: update })

const createApplicant = async (applicant: IApplicantNew) => {
  const { firstname, lastname, phone, email } = applicant
  const now = new Date()
  const payload: IApplicant = {
    _id: new ObjectId(),
    firstname,
    lastname,
    phone,
    email: email.toLowerCase(),
    last_connection: now,
    createdAt: now,
    updatedAt: now,
  }
  await getDbCollection("applicants").insertOne(payload)
  return payload
}

export const getApplicantByEmail = (email: string) => getApplicantFromDB({ email: email.toLowerCase() })

export const getOrCreateApplicant = async (applicant: IApplicantNew | IApplicant) => {
  let dbApplicantOpt = await getApplicantByEmail(applicant.email.toLowerCase())
  if (dbApplicantOpt) {
    // update last_connection date on applicant collection (last application = last connection)
    await updateApplicant(dbApplicantOpt._id, { last_connection: new Date() })
  } else {
    dbApplicantOpt = await createApplicant(applicant)
  }

  return dbApplicantOpt
}
