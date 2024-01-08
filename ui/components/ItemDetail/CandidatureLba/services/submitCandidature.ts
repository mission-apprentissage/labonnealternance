import extractCompanyValues from "../../../../services/extractCompanyValues"
import postCandidature from "../../../../services/postCandidature"

export default async function submitCandidature({
  applicantValues,
  setSendingState,
  item = {},
  caller = null,
  jobLabel = null,
}: {
  applicantValues: any // TODO
  setSendingState: (state: string) => void
  item?: any // TODO
  caller?: string | null
  jobLabel?: string | null
}) {
  setSendingState("currently_sending")
  let success = true
  let result = null
  try {
    result = await postCandidature({ applicantValues, company_h: extractCompanyValues(item), jobLabel, caller })
    if (result !== "ok") {
      success = false
    }
  } catch (error) {
    success = false
  }

  if (success) {
    setSendingState("ok_sent")
  } else {
    setSendingState(result ? result : "not_sent_because_of_errors")
  }
  return success
}
