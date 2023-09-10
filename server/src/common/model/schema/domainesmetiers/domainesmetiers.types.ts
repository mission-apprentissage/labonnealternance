interface IDomainesMetiers {
  sous_domaine: string
  domaine: string
  codes_romes: string[]
  intitules_romes: string[]
  codes_rncps: string[]
  intitules_rncps: string[]
  mots_clefs: string
  mots_clefs_specifiques: string
  appellations_romes: string
  couples_appellations_rome_metier: object[]
  codes_fap: string[]
  intitules_fap: string[]
  sous_domaine_onisep: string[]
  couples_romes_metiers: object[]
  created_at: Date
  last_update_at: Date
}

export type { IDomainesMetiers }
