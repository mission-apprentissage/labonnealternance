interface IWidgetParameter {
  id_catalogue: string
  etablissement_siret: string
  formation_intitule: string
  zip_code: string
  formation_cfd: string
  email_rdv: string
  is_custom_email_rdv: boolean
  referrers: object[]
  rco_formation_id: string
  catalogue_published: boolean
  last_catalogue_sync_date: Date
  id_parcoursup: string
  cle_ministere_educatif: string
  etablissement_raison_sociale: string
  etablissement_formateur_adresse: string
  etablissement_formateur_code_postal: string
  etablissement_formateur_nom_departement: string
  etablissement_formateur_localite: string
  lieu_formation_adresse: string
  etablissement_formateur_siret: string
  etablissement_gestionnaire_siret: string
  city: string
  created_at: Date
  historization_date: Date
}

export { IWidgetParameter }
