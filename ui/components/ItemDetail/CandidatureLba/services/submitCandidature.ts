import axios from "axios"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { apiEndpoint } from "../../../../config/config"

export default async function submitCandidature({
  formValues,
  setSendingState,
  LbaJob = {},
}: {
  formValues: any // TODO
  setSendingState: (state: string) => void
  LbaJob?: any // TODO
}) {
  setSendingState("currently_sending")

  const candidatureApi = apiEndpoint + "/v2/_private/application"

  const payload = {
    applicant_first_name: formValues.firstName,
    applicant_last_name: formValues.lastName,
    applicant_email: formValues.email,
    applicant_phone: formValues.phone,
    message: formValues.message,
    applicant_file_name: formValues.fileName,
    applicant_file_content: formValues.fileContent,
    company_siret: LbaJob.ideaType === LBA_ITEM_TYPE_OLD.LBA ? LbaJob.company?.siret : undefined, // either company_siret or job_id
    job_id: LbaJob.ideaType === LBA_ITEM_TYPE_OLD.MATCHA ? LbaJob.job?.id : undefined, // either company_siret or job_id
  }

  try {
    await axios.post(candidatureApi, payload, { headers: { Authorization: `Bearer ${LbaJob.token}` } })
    setSendingState("ok_sent")
    return true
  } catch (error) {
    setSendingState(error.response?.data?.message)
    return false
  }
}
