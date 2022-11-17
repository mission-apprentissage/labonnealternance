import postCandidature from "../../../../services/postCandidature.js"
import extractCompanyValues from "../../../../services/extractCompanyValues.js"

export default async function submitCandidature(
  { applicantValues, setSendingState = () => {}, item = {}, caller = null },
  _postCandidature = postCandidature,
  _extractCompanyValues = extractCompanyValues
) {
  setSendingState("currently_sending")
  let success = true
  let result = null
  try {
    result = await _postCandidature(applicantValues, _extractCompanyValues(item), caller)
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
