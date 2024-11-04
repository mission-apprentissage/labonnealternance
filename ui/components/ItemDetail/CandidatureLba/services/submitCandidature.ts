import { useContext } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { DisplayContext } from "@/context/DisplayContextProvider"
import { getItemId } from "@/utils/getItemId"
import { localStorageSet, sessionStorageSet } from "@/utils/localStorage"

import { apiPost } from "../../../../utils/api.utils"

export const useSubmitCandidature = (): typeof submitCandidature => {
  const displayContext = useContext(DisplayContext)
  if (!displayContext) {
    return submitCandidature
  }
  const { formValues } = displayContext
  const { job } = formValues ?? {}
  const { label: job_searched_by_user } = job ?? {}
  return (props) =>
    submitCandidature({
      ...props,
      formValues: {
        ...props.formValues,
        job_searched_by_user,
      },
    })
}

export default async function submitCandidature({
  formValues,
  setSendingState,
  LbaJob = {},
  caller,
}: {
  formValues: any // TODO
  setSendingState: (state: string) => void
  LbaJob?: any // TODO
  caller?: string
}) {
  setSendingState("currently_sending")

  const applicationPayload = {
    applicant_first_name: formValues.firstName,
    applicant_last_name: formValues.lastName,
    applicant_email: formValues.email,
    applicant_phone: formValues.phone,
    applicant_message: formValues.message,
    applicant_file_name: formValues.fileName,
    applicant_file_content: formValues.fileContent,
    job_searched_by_user: formValues.job_searched_by_user,
  }
  const payload = {
    ...applicationPayload,
    company_siret: LbaJob.ideaType === LBA_ITEM_TYPE_OLD.LBA ? LbaJob.company?.siret : undefined, // either company_siret or job_id
    job_id: LbaJob.ideaType === LBA_ITEM_TYPE_OLD.MATCHA ? LbaJob.job?.id : undefined, // either company_siret or job_id
    caller,
  }

  try {
    await apiPost("/_private/application", { body: payload, headers: { authorization: `Bearer ${LbaJob.token}` } }, {}, "V2")
    sessionStorageSet("application-form-values", applicationPayload)
    localStorageSet(`application-${LbaJob.ideaType}-${getItemId(LbaJob)}`, Date.now().toString())
    setSendingState("ok_sent")
    return true
  } catch (error) {
    setSendingState(error?.message)
    return false
  }
}
