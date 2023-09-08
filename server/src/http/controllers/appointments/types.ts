type TCreateContextResponseError = {
  error: string
}

type TCreateContextResponse = {
  etablissement_formateur_entreprise_raison_sociale: string
  intitule_long: string
  lieu_formation_adresse: string
  code_postal: string
  etablissement_formateur_siret: string
  cfd: string
  localite: string
  id_rco_formation: string
  cle_ministere_educatif: string
  form_url: string
}

type TCreateContextBody = {
  idParcoursup?: string
  idRcoFormation?: string
  idActionFormation?: string
  idCleMinistereEducatif?: string
  trainingHasJob?: boolean
  referrer: string
}

export type { TCreateContextResponseError, TCreateContextResponse, TCreateContextBody }
