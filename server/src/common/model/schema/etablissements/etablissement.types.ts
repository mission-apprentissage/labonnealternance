import { IMailing } from "../appointments/appointments.types"

export interface IEtablissement {
  _id: string
  formateur_siret: string
  gestionnaire_siret: string
  raison_sociale: string
  adresse: string
  formateur_address: string
  formateur_zip_code: string
  formateur_city: string
  gestionnaire_email: string
  premium_invitation_date: Date
  premium_activation_date: Date
  premium_refusal_date: Date
  premium_affelnet_invitation_date: Date
  premium_affelnet_activation_date: Date
  premium_affelnet_refusal_date: Date
  optout_invitation_date: Date
  optout_activation_scheduled_date: Date
  optout_activation_date: Date
  optout_refusal_date: Date
  mailing: IMailing[]
  last_catalogue_sync_date: Date
  created_at: Date
  affelnet_perimetre: boolean
  to_etablissement_emails?: {
    campaign?: string
    message_id?: string
    status?: string
    webhook_status_at?: Date
    email_sent_at?: Date
  }[]
}
