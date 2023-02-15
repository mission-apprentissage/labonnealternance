interface IWidgetParameter {
  id_catalogue: string
  etablissement_siret: string
  formation_intitule: string
  code_postal: string
  formation_cfd: string
  email_rdv: string
  is_custom_email_rdv: boolean
  referrers: object[]
  id_rco_formation: string
  catalogue_published: boolean
  last_catalogue_sync: Date
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
  localite: string
  created_at: Date
}

export { IWidgetParameter }
