import { useMutation } from "@tanstack/react-query"
import { useContext } from "react"
import type { IApplicationApiPrivate, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import type { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { useLocalStorage } from "@/app/hooks/useLocalStorage"
import { DisplayContext } from "@/context/DisplayContextProvider"
import { apiPost } from "@/utils/api.utils"
import { sessionStorageSet } from "@/utils/localStorage"
import { getMatomoJobOfferType, MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"
import type { IApplicationSchemaInitValues } from "./getSchema"

export const useStoredApplicationDate = (item: ILbaItem) => {
  return useLocalStorage<number>(`application-${oldItemTypeToNewItemType(item.ideaType)}-${item.id}`)
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
    applicant_contract_duration: formValues.applicant_contract_duration,
    applicant_contract_start: formValues.applicant_contract_start,
    applicant_formation_description: formValues.applicant_formation_description,
    applicant_inscription_formation: formValues.applicant_inscription_formation,
    applicant_rythm_description: formValues.applicant_rythm_description,
  }

  sessionStorageSet("application-form-values", payload)
  await apiPost("/v2/_private/application", { body: payload, headers: { authorization: `Bearer ${LbaJob.token}` } }, {})
}

export const useSubmitCandidature = (
  LbaJob: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson,
  caller?: string
): {
  handleSubmitCandidature: (props: { formValues: IApplicationSchemaInitValues }) => void
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isDone: boolean
  error: unknown
  applicationDate: Date | null
} => {
  const { storedValue: applicationDateTimestamp, setLocalStorage: setApplicationDate } = useStoredApplicationDate(LbaJob)

  const { isPending, error, isSuccess, isError, mutate } = useMutation({
    mutationKey: ["submitCandidature", LbaJob.id],
    mutationFn: submitCandidature,
    onSuccess: (_, variables) => {
      setApplicationDate(Date.now())
      pushMatomoEvent({
        event: MATOMO_EVENTS.SMART_APPLY_CONFIRMED,
        job_offer_id: variables.LbaJob.id,
        job_offer_type: getMatomoJobOfferType(variables.LbaJob.ideaType),
        job_offer_company: variables.LbaJob.company?.name || "non_renseigné",
        job_offer_name: variables.LbaJob.title || "non_renseigné",
        has_cv: Boolean(variables.formValues.applicant_attachment_name),
        has_motivation: Boolean(variables.formValues.applicant_message?.trim()),
      })
    },
  })

  const displayContext = useContext(DisplayContext)

  const handleSubmitCandidature = ({ formValues }: { formValues: IApplicationSchemaInitValues }) => {
    const job_searched_by_user = displayContext?.formValues?.job?.label

    mutate({
      formValues: {
        ...formValues,
        ...(job_searched_by_user ? { job_searched_by_user } : {}),
      },
      LbaJob,
      caller,
    })
  }

  const applicationDate = applicationDateTimestamp ? new Date(applicationDateTimestamp) : null

  return {
    handleSubmitCandidature,
    isLoading: isPending,
    error,
    isSuccess,
    isError,
    isDone: isSuccess || isError,
    applicationDate,
  }
}
