import { IMailing } from "../appointments/appointments.types.js"

interface IEtablissement {
  siret_formateur: string
  siret_gestionnaire: string
  raison_sociale: string
  adresse: string
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
  last_catalogue_sync: Date
  created_at: Date
  affelnet_perimetre: boolean
}

export { IEtablissement }
