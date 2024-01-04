import extractCompanyValues from "../../../../services/extractCompanyValues"
import postCandidature from "../../../../services/postCandidature"

export default async function submitCandidature({
  applicantValues,
  setSendingState = (m: string) => {
    console.log(m)
  },
  item = {},
  caller = null,
  jobLabel = null,
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
