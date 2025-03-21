import { useMutation } from "@tanstack/react-query"
import { useContext } from "react"
import { IApplicationApiPrivate, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

import { DisplayContext } from "@/context/DisplayContextProvider"
import { getItemId } from "@/utils/getItemId"
import { localStorageSet, sessionStorageSet } from "@/utils/localStorage"

import { apiPost } from "../../../../utils/api.utils"

import { IApplicationSchemaInitValues } from "./getSchema"

export const useSubmitCandidature = (
  LbaJob: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson,
  caller?: string
): {
  submitCandidature: (props: { formValues: IApplicationSchemaInitValues }) => void
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isDone: boolean
  error: unknown
} => {
  const { isLoading, error, isSuccess, isError, mutate } = useMutation(["submitCandidature", LbaJob.id], submitCandidature)
  const displayContext = useContext(DisplayContext)
  let finalSubmitCandidature = mutate
  if (displayContext) {
    const { formValues } = displayContext
    const { job } = formValues ?? {}
    const { label: job_searched_by_user } = job ?? {}
    finalSubmitCandidature = (props) =>
      mutate({
        ...props,
        LbaJob,
        caller,
        formValues: {
          ...props.formValues,
          job_searched_by_user,
        },
      })
  }
  return { submitCandidature: finalSubmitCandidature, isLoading, error, isSuccess, isError, isDone: isSuccess || isError }
}

async function submitCandidature({
  formValues,
  LbaJob,
  caller,
}: {
  formValues: IApplicationSchemaInitValues
  LbaJob: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson
  caller?: string
}) {
  const payload: IApplicationApiPrivate = {
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
    application_url: typeof window !== "undefined" ? window?.location?.href : null,
  }

  await apiPost("/v2/_private/application", { body: payload, headers: { authorization: `Bearer ${LbaJob.token}` } }, {})
  sessionStorageSet("application-form-values", payload)
  localStorageSet(`application-${LbaJob.ideaType}-${getItemId(LbaJob)}`, Date.now().toString())
}
