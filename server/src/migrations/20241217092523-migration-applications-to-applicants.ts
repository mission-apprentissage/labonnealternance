import { ObjectId } from "bson"
import { IApplicant, ZApplicant } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"

type ApplicationAggregate = {
  _id: string
  firstname: string
  lastname: string
  phone: string
  email: string
  ids: string[]
  last_connection: Date
}

export const up = async () => {
  const applications = (await getDbCollection("applications")
    .aggregate([
      {
        $group: {
          _id: "$applicant_email",
          firstname: { $first: "$applicant_first_name" },
          lastname: { $first: "$applicant_last_name" },
          phone: { $first: "$applicant_phone" },
          email: { $first: "$applicant_email" },
          ids: { $push: "$_id" },
          last_connection: { $last: "$created_at" },
        },
      },
    ])
    .toArray()) as ApplicationAggregate[]
  const stat = { error: 0, success: 0, total: applications.length }

  for await (const application of applications) {
    const { firstname, lastname, email, phone, last_connection, ids } = application
    const now = new Date()
    const applicant: IApplicant = {
      _id: new ObjectId(),
      firstname,
      lastname,
      phone,
      email,
      last_connection,
      createdAt: now,
      updatedAt: now,
    }
    const validation = ZApplicant.safeParse(applicant)
    if (validation.success) {
      stat.success++
      await getDbCollection("applicants").insertOne(applicant)
      await getDbCollection("applications").updateMany({ _id: ids }, { $set: { applicant_id: applicant._id } })
    } else {
      stat.error++
    }
  }
  console.log(stat)
}
