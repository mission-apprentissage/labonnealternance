interface IMailing {
  campaign: string
  message_id: string
  status: string
  webhook_status_at: Date
  email_sent_at: Date
}

interface IAppointments {
  applicant_id: string
  applicant_message_to_cfa: string
  cfa_formateur_siret: string
  appointment_origin: string
  cfa_read_appointment_details_date: Date
  to_applicant_mails: IMailing[]
  to_cfa_mails: IMailing[]
  cle_ministere_educatif: string
  created_at: Date
  last_update_at: Date
  email_cfa: string
  is_anonymized: boolean
  cfa_recipient_email: string
}

export { IAppointments, IMailing }
