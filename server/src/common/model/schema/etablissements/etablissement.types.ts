import { IMailing } from "../appointments/appointments.types.js"

interface IEtablissement {
  formateur_siret: string
  gestionnaire_siret: string
  raison_sociale: string
  adresse: string
  zip_code: string
  city: string
  gestionnaire_email: string
  etablissement_formateur_courriel: string
  premium_invitation_date: Date
  premium_activation_date: Date
  premium_refusal_date: Date
  optout_invitation_date: Date
  optout_activation_scheduled_date: Date
  optout_activation_date: Date
  optout_refusal_date: Date
  mailing: IMailing[]
  last_catalogue_sync_date: Date
  created_at: Date
}

export { IEtablissement }
