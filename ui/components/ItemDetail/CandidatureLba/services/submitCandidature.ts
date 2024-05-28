import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { apiPost } from "../../../../utils/api.utils"

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
    await apiPost("/_private/application", { body: payload, headers: { authorization: `Bearer ${LbaJob.token}` } }, {}, "V2")
    setSendingState("ok_sent")
    return true
  } catch (error) {
    setSendingState(error?.message)
    return false
  }
}
