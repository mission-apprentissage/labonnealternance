import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("applications").updateMany(
    {},
    {
      $unset: {
        applicant_first_name: "",
        applicant_last_name: "",
        applicant_email: "",
        applicant_phone: "",
      },
    }
  )
}
