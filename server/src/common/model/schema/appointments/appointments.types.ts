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
  cfa_gestionnaire_siret: string
  cfa_formateur_siret: string
  appointment_origin: string
  admin_comment: string
  cfa_callback_intention_date: Date
  cfa_read_appointment_details_date: Date
  to_applicant_mails: IMailing[]
  to_cfa_mails: IMailing[]
  email_premiere_demande_cfa_message_id: string
  rco_formation_id: string
  cle_ministere_educatif: string
  created_at: Date
  last_update_at: Date
  email_cfa: string
  is_anonymized: boolean
  cfa_recipient_email: string
}

export { IAppointments, IMailing }
