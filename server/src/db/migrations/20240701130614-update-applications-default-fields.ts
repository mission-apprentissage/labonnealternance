import { getDbCollection } from "../../common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("applications").updateMany({ company_recruitment_intention: { $exists: false } }, { $set: { company_recruitment_intention: null, company_feedback: null } })
}
