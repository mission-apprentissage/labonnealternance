import { ObjectId } from "bson"
import { Filter } from "mongodb"
import { IApplicant, IApplicantNew } from "shared"

import { getDbCollection } from "../common/utils/mongodbUtils"

export const getApplicantFromDB = (payload: Filter<IApplicant>) => getDbCollection("applicants").findOne({ payload })

const updateApplicantLastConnectionDate = (applicantId: ObjectId) => getDbCollection("applicants").updateOne({ _id: applicantId }, { $set: { last_connection: new Date() } })

const createApplicant = async (applicant: IApplicantNew) => {
  const { firstname, lastname, phone, email } = applicant
  const now = new Date()
  const payload: IApplicant = {
    _id: new ObjectId(),
    firstname,
    lastname,
    phone,
    email,
    last_connection: now,
    createdAt: now,
    updatedAt: now,
  }
  await getDbCollection("applicants").insertOne(payload)
  return payload
}
export const getOrCreateApplicantAndUpdateLastConnection = async (applicant: IApplicantNew | IApplicant) => {
  let user = await getApplicantFromDB({ email: applicant.email })

  if (user) {
    // update last_connection date on applicant collection (last application = last connection)
    await updateApplicantLastConnectionDate(user._id)
  } else {
    user = await createApplicant(applicant)
  }

  return user
}
