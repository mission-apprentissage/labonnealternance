import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { uploadContactListToBrevo } from "@/services/brevo.service"

export const exportRecruteursToBrevo = async () => {
  const applications = await getDbCollection("applications")
    .aggregate([
      {
        $match: {
          created_at: { $gte: new Date("2025-09-15") }, // demandé par le métier @aurélie
          job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA,
          company_recruitment_intention: { $ne: null },
          company_feedback_date: { $ne: null },
        },
      },
      {
        $lookup: {
          from: "applicants",
          localField: "applicant_id",
          foreignField: "_id",
          as: "applicant",
        },
      },
      { $unwind: "$applicant" },
      {
        $project: {
          _id: 0,
          email: "$company_email",
          firstname: "$applicant.firstname",
          lastname: "$applicant.lastname",
          company_feedback: "$company_recruitment_intention",
          feedback_date: "$company_feedback_date",
        },
      },
    ])
    .toArray()

  await uploadContactListToBrevo(
    "MARKETING",
    applications,
    [
      {
        key: "email",
        header: "EMAIL",
      },
      {
        key: "firstname",
        header: "PRENOM",
      },
      {
        key: "lastname",
        header: "NOM",
      },
      {
        key: "company_feedback",
        header: "REPONSE_EMPLOYEUR",
      },
      {
        key: "feedback_date",
        header: "DATE_REPONSE_EMPLOYEUR",
      },
    ],
    "628"
  )
}
