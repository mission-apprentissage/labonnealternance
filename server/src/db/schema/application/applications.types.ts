interface IApplication {
  applicant_email: string
  applicant_first_name: string
  applicant_last_name: string
  applicant_phone: string
  applicant_attachment_name: string
  applicant_message_to_company: string
  company_recruitment_intention: string
  company_feedback: string
  company_siret: string
  company_email: string
  company_name: string
  company_naf: string
  company_address: string
  job_origin: string
  job_title: string
  job_id: string
  to_applicant_message_id: string
  to_company_message_id: string
  caller: string
  is_anonymized: boolean
  company_feedback_date: Date
  created_at: Date
  last_update_at: Date
}

export { IApplication }
