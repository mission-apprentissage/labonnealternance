import { useContext } from "react"
import { IApplicationApiPayload, ILbaItemLbaCompany, ILbaItemLbaJob } from "shared"

import { DisplayContext } from "@/context/DisplayContextProvider"
import { getItemId } from "@/utils/getItemId"
import { localStorageSet, sessionStorageSet } from "@/utils/localStorage"

import { apiPost } from "../../../../utils/api.utils"

import { IApplicationSchemaInitValues } from "./getSchema"

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
  formValues: IApplicationSchemaInitValues
  setSendingState: (state: string) => void
  LbaJob?: ILbaItemLbaCompany | ILbaItemLbaJob
  caller?: string
}) {
  setSendingState("currently_sending")

  const payload: IApplicationApiPayload = {
    applicant_first_name: formValues.applicant_first_name,
    applicant_last_name: formValues.applicant_last_name,
    applicant_email: formValues.applicant_email,
    applicant_phone: formValues.applicant_phone,
    applicant_message: formValues.applicant_message,
    applicant_attachment_name: formValues.applicant_attachment_name,
    applicant_attachment_content: formValues.applicant_attachment_content,
    job_searched_by_user: formValues.job_searched_by_user,
    recipient_id: LbaJob.recipient_id,
    caller,
  }

  try {
    await apiPost("/_private/application", { body: payload, headers: { authorization: `Bearer ${LbaJob.token}` } }, {}, "V2")
    sessionStorageSet("application-form-values", payload)
    localStorageSet(`application-${LbaJob.ideaType}-${getItemId(LbaJob)}`, Date.now().toString())
    setSendingState("ok_sent")
    return true
  } catch (error) {
    setSendingState(error?.message)
    return false
  }
}
