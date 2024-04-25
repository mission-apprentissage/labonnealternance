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
  cfd: IntituleCfd
  niveau: Niveau
  rncp: string
}

interface IntituleCfd {
  long: string
  court: string
}

interface Niveau {
  cfd: NiveauCfd
  rncp: Rncp
}

interface NiveauCfd {
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
  cfd: BaseLegaleCfd
}

interface BaseLegaleCfd {
  creation: string
  abrogation: string
}

interface BlocsCompetences {
  rncp: BlocCompetencesRncp[]
}

interface BlocCompetencesRncp {
  code: string
  intitule: string
}

interface ConventionCollectives {
  rncp: ConventionCollectivesRncp[]
}

interface ConventionCollectivesRncp {
  numero: string
  intitule: string
}

interface Domaines {
  formacodes: Formacodes
  nsf: Nsf
  rome: Rome
}

interface Formacodes {
  rncp: FormacodesRncp[]
}

interface FormacodesRncp {
  code: string
  intitule: string
}

interface Nsf {
  cfd: NsfCfd
  rncp: NsfRncp[]
}

interface NsfCfd {
  code: string
  intitule: string
}

interface NsfRncp {
  code: string
  intitule: string
}

interface Rome {
  rncp: RomeRncp[]
}

interface RomeRncp {
  code: string
  intitule: string
}

interface PeriodeValidite {
  debut: string
  fin: string
  cfd: PeriodeValiditeCfd
  rncp: PeriodeValiditeRncp
}

interface PeriodeValiditeCfd {
  ouverture: string
  fermeture: string
  premiere_session: number
  derniere_session: number
}

interface PeriodeValiditeRncp {
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
  cfd: NatureCfd
}

interface NatureCfd {
  code: string
  libelle: string
}

interface VoieAcces {
  rncp: VoieAccesRncp
}

interface VoieAccesRncp {
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
  cfd: ContinuiteCfd[]
  rncp: ContinuiteRncp[]
}

interface ContinuiteCfd {
  ouverture: string
  fermeture: string
  code: string
  courant: boolean
}

interface ContinuiteRncp {
  activation: string
  fin_enregistrement: string
  code: string
  courant: boolean
}
