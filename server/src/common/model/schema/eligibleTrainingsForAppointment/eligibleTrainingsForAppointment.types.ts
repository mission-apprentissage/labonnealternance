interface IEligibleTrainingsForAppointment {
  training_id_catalogue: string
  etablissement_siret: string
  training_intitule_long: string
  etablissement_formateur_zip_code: string
  training_code_formation_diplome: string
  lieu_formation_email: string
  is_lieu_formation_email_customized: boolean
  referrers: object[]
  rco_formation_id: string
  is_catalogue_published: boolean
  last_catalogue_sync_date: Date
  parcoursup_id: string
  cle_ministere_educatif: string
  etablissement_formateur_raison_sociale: string
  etablissement_formateur_street: string
  departement_etablissement_formateur: string
  etablissement_formateur_city: string
  lieu_formation_street: string
  etablissement_formateur_siret: string
  etablissement_gestionnaire_siret: string
  lieu_formation_city: string
  created_at: Date
  historization_date: Date
}

export { IEligibleTrainingsForAppointment }
