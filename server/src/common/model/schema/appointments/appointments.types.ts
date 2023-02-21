interface IMailing {
  campaign: string
  message_id: string
  status: string
  webhook_status_at: Date
  email_sent_at: Date
}

interface IAppointments {
  candidat_id: string
  numero_de_la_demande: string
  motivations: string
  etablissement_id: string
  formation_id: string
  referrer: string
  referrer_link: string
  statut_general: string
  champs_libre_status: string
  champs_libre_commentaire: string
  cfa_pris_contact_candidat: boolean
  cfa_pris_contact_candidat_date: Date
  cfa_read_appointment_details_at: Date
  candidat_contacted_at: Date
  candidat_mailing: IMailing[]
  cfa_mailing: IMailing[]
  email_premiere_demande_candidat_date: Date
  email_premiere_demande_candidat_message_id: string
  email_premiere_demande_candidat_statut: string
  email_premiere_demande_candidat_statut_date: Date
  email_premiere_demande_cfa_date: Date
  email_premiere_demande_cfa_message_id: string
  email_premiere_demande_cfa_statut: string
  email_premiere_demande_cfa_statut_date: Date
  id_rco_formation: string
  cle_ministere_educatif: string
  created_at: Date
  last_update_at: Date
  email_cfa: string
}

export { IAppointments, IMailing }
