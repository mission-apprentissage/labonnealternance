import { Entity } from "../../generic/Entity.js"

export type Application2 = Entity & {
  applicantId: string
  jobId: string
  applicant_attachment_name: string
  applicant_message_to_company: string
  company_recruitment_intention: string
  companyFeedback?: {
    message: string
    date: Date
  }
  to_applicant_message_id: string
  to_company_message_id: string
  caller: string
  is_anonymized: boolean
}
