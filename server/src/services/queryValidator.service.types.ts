export interface CertificationAPIApprentissage {
  identifiant: Identifiant
  intitule: Intitule
  base_legale: BaseLegale
  blocs_competences: BlocsCompetences
  convention_collectives: ConventionCollectives
  domaines: Domaines
  periode_validite: PeriodeValidite
  type: Type
  continuite: Continuite
}

interface Identifiant {
  cfd: string
  rncp: string
  rncp_anterieur_2019: boolean
}

interface Intitule {
  cfd: Cfd
  niveau: Niveau
  rncp: string
}

interface Cfd {
  long: string
  court: string
}

interface Niveau {
  cfd: Cfd2
  rncp: Rncp
}

interface Cfd2 {
  europeen: string
  formation_diplome: string
  interministeriel: string
  libelle: string
  sigle: string
}

interface Rncp {
  europeen: string
}

interface BaseLegale {
  cfd: Cfd3
}

interface Cfd3 {
  creation: string
  abrogation: string
}

interface BlocsCompetences {
  rncp: Rncp2[]
}

interface Rncp2 {
  code: string
  intitule: string
}

interface ConventionCollectives {
  rncp: Rncp3[]
}

interface Rncp3 {
  numero: string
  intitule: string
}

interface Domaines {
  formacodes: Formacodes
  nsf: Nsf
  rome: Rome
}

interface Formacodes {
  rncp: Rncp4[]
}

interface Rncp4 {
  code: string
  intitule: string
}

interface Nsf {
  cfd: Cfd4
  rncp: Rncp5[]
}

interface Cfd4 {
  code: string
  intitule: string
}

interface Rncp5 {
  code: string
  intitule: string
}

interface Rome {
  rncp: Rncp6[]
}

interface Rncp6 {
  code: string
  intitule: string
}

interface PeriodeValidite {
  debut: string
  fin: string
  cfd: Cfd5
  rncp: Rncp7
}

interface Cfd5 {
  ouverture: string
  fermeture: string
  premiere_session: number
  derniere_session: number
}

interface Rncp7 {
  actif: boolean
  activation: string
  debut_parcours: string
  fin_enregistrement: string
}

interface Type {
  nature: Nature
  gestionnaire_diplome: string
  enregistrement_rncp: string
  voie_acces: VoieAcces
  certificateurs_rncp: CertificateursRncp[]
}

interface Nature {
  cfd: Cfd6
}

interface Cfd6 {
  code: string
  libelle: string
}

interface VoieAcces {
  rncp: Rncp8
}

interface Rncp8 {
  apprentissage: boolean
  experience: boolean
  candidature_individuelle: boolean
  contrat_professionnalisation: boolean
  formation_continue: boolean
  formation_statut_eleve: boolean
}

interface CertificateursRncp {
  siret: string
  nom: string
}

interface Continuite {
  cfd: Cfd7[]
  rncp: Rncp9[]
}

interface Cfd7 {
  ouverture: string
  fermeture: string
  code: string
  courant: boolean
}

interface Rncp9 {
  activation: string
  fin_enregistrement: string
  code: string
  courant: boolean
}
