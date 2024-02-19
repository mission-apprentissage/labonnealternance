export interface IRncpTCO {
  result: Result
  messages: Messages
}

interface Result {
  _id: string
  cfds: string[]
  code_rncp: string
  intitule_diplome: string
  date_fin_validite_enregistrement: string
  active_inactive: string
  etat_fiche_rncp: string
  niveau_europe: string
  code_type_certif: any
  type_certif: any
  ancienne_fiche: string[]
  nouvelle_fiche: any
  demande: number
  certificateurs: Certificateur[]
  nsf_code: string
  nsf_libelle: string
  romes: Rome[]
  blocs_competences: BlocsCompetence[]
  voix_acces: any
  partenaires: Partenaire[]
  type_enregistrement: string
  si_jury_ca: string
  eligible_apprentissage: boolean
  created_at: string
  last_update_at: string
  __v: number
  rncp_outdated: boolean
  releated: Releated[]
}

interface Certificateur {
  certificateur: string
  siret_certificateur: string
}

interface Rome {
  rome: string
  libelle: string
}

interface BlocsCompetence {
  numero_bloc: string
  intitule: string
  liste_competences: string
  modalites_evaluation: string
}

interface Partenaire {
  Nom_Partenaire: string
  Siret_Partenaire: string
  Habilitation_Partenaire: string
}

interface Releated {
  cfd: Cfd
  mefs: Mefs
}

interface Cfd {
  cfd: string
  cfd_outdated: boolean
  date_fermeture: number
  date_ouverture: number
  specialite: any
  niveau: string
  intitule_long: string
  intitule_court: string
  diplome: string
  libelle_court: string
  niveau_formation_diplome: string
}

interface Mefs {
  mefs10: any[]
  mefs8: any[]
  mefs_aproximation: any[]
  mefs11: any[]
}

interface Messages {
  code_rncp: string
  releated: Releated2[]
}

interface Releated2 {
  cfd: Cfd2
  mefs: Mefs2
}

interface Cfd2 {
  cfd: string
  specialite: string
  niveau: string
  intitule_long: string
  intitule_court: string
  diplome: string
  libelle_court: string
  niveau_formation_diplome: string
}

interface Mefs2 {
  mefs10: string
  mefs8: string
  mefs_aproximation: string
  mefs11: string
}
