import { Entity } from "../../generic/Entity.js"

export enum ApplicantRole {
  STUDENT = "STUDENT",
  PARENT = "PARENT",
}

export type Application2 = Entity & {
  applicant_id: string
  job_id: string
  applicant_role: ApplicantRole
  applicant_attachment_name: string
  applicant_message_to_company: string
  company_recruitment_intention: string
  company_feedback?: {
    message: string
    date: Date
  }
  to_applicant_message_id: string
  to_company_message_id: string
  caller: string
  is_anonymized: boolean
}
