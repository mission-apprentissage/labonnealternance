import { testingParameters } from "../utils/testingParameters"

export default function extractCandidatureParams(applicant_h, company_h, caller) {
  let res = {}

  // 8 mandatory fields
  res["company_email"] = company_h?.email || "dummy@beta.gouv.fr"
  res["iv"] = company_h?.iv || "1f77e84c5735d50f8e326ed8af85452e"
  res["applicant_first_name"] = applicant_h?.firstName || null
  res["applicant_last_name"] = applicant_h?.lastName || null
  res["applicant_phone"] = applicant_h?.phone || null
  res["message"] = applicant_h?.message || null
  res["applicant_email"] = applicant_h?.email || "dummy@beta.gouv.fr"
  res["applicant_file_name"] = applicant_h?.fileName || "dummy.pdf"
  res["applicant_file_content"] = applicant_h?.fileContent || null
  res["company_type"] = company_h?.type || null
  //res["interet_offres_mandataire"] = applicant_h?.interetOffresMandataire || false;

  // Optional fields
  res["company_siret"] = company_h?.siret || null
  res["company_name"] = company_h?.name || null
  res["company_address"] = company_h?.address || null
  res["company_naf"] = company_h?.naf || null
  res["job_title"] = company_h?.job_title || null
  res["job_id"] = company_h?.job_id || null

  // test field
  if (testingParameters?.secret) {
    res["company_email"] = testingParameters.simulatedRecipient
    res["crypted_company_email"] = company_h?.email || "dummy@beta.gouv.fr"
    res["applicant_email"] = testingParameters.simulatedRecipient
    res["secret"] = testingParameters.secret
  }

  // appelant (widget)
  res["caller"] = caller

  return res
}
