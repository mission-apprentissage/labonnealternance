interface IDomainesMetiers {
  sous_domaine: string
  sous_domaine_sans_accent_computed: string
  domaine: string | null
  domaine_sans_accent_computed: string | null
  codes_romes: string[]
  intitules_romes: string[]
  intitules_romes_sans_accent_computed: string[]
  codes_rncps: string[]
  intitules_rncps: string[]
  intitules_rncps_sans_accent_computed: string[]
  mots_clefs: string
  mots_clefs_sans_accent_computed: string
  mots_clefs_specifiques: string
  mots_clefs_specifiques_sans_accent_computed: string
  appellations_romes: string
  appellations_romes_sans_accent_computed: string
  couples_appellations_rome_metier: {
    codeRome: string
    intitule: string
    appellation: string
  }[]
  codes_fap: string[]
  intitules_fap: string[]
  intitules_fap_sans_accent_computed: string[]
  sous_domaine_onisep: string[]
  sous_domaine_onisep_sans_accent_computed: string[]
  couples_romes_metiers: {
    codeRome: string
    intitule: string
  }[]
  created_at: Date
  last_update_at: Date
}

export type { IDomainesMetiers }
