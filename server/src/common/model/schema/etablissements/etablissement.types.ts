import { IMailing } from "../appointments/appointments.types.js"

interface IEtablissement {
  siret_formateur: string
  siret_gestionnaire: string
  raison_sociale: string
  adresse: string
  code_postal: string
  localite: string
  email_decisionnaire: string
  etablissement_formateur_courriel: string
  premium_invited_at: Date
  premium_activated_at: Date
  premium_refused_at: Date
  opt_mode: string
  opt_in_activated_at: Date
  opt_out_invited_at: Date
  opt_out_will_be_activated_at: Date
  opt_out_activated_at: Date
  opt_out_refused_at: Date
  opt_out_question: string
  mailing: IMailing[]
  last_catalogue_sync: Date
  created_at: Date
}

export { IEtablissement }
