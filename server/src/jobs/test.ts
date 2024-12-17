import { ObjectId } from "bson"
import { IApplicant, IApplication, ZApplicant } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { asyncForEach } from "../common/utils/asyncUtils"

type ApplicationAggregate = Pick<IApplication, "applicant_email" | "applicant_first_name" | "applicant_last_name" | "applicant_phone" | "_id">

export const migrationTest = async () => {
  // console.log(extensions.telephone.safeParse("0690760552"))
  // return
  const applications = (await getDbCollection("applications")
    .find({}, { projection: { applicant_first_name: 1, applicant_last_name: 1, applicant_email: 1, applicant_phone: 1, _id: 1 } })
    .toArray()) as ApplicationAggregate[]

  const stat = { error: 0, success: 0, total: applications.length }

  await asyncForEach(applications, async (application) => {
    const { applicant_first_name, applicant_email, applicant_last_name, applicant_phone, _id } = application
    const now = new Date()
    const applicant: IApplicant = {
      _id: new ObjectId(),
      firstname: applicant_first_name,
      lastname: applicant_last_name,
      phone: applicant_phone,
      email: applicant_email,
      last_connection: null,
      createdAt: now,
      updatedAt: now,
    }
    const validation = ZApplicant.safeParse(applicant)
    if (!validation.success) {
      stat.error++
      console.log({ applicant, err: validation.error.errors })
    } else {
      stat.success++
    }
  })
  console.log(stat)
}
