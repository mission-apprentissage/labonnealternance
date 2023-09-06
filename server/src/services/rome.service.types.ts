import { TDayjs } from "./dayjs.service"

export interface IPEAPIToken {
  access_token: string
  scope: string
  token_type: string
  expires_in: number
  expire?: TDayjs
}

export interface IRomeDetailsFromAPI {
  code: string
  libelle: string
  definition: string
  acces: string
  condition: string
  riasecMajeur: string
  riasecMineur: string
  codeIsco: string
  particulier: boolean
  domaineProfessionnel: DomaineProfessionnel
  appellations: Appellation[]
  competencesDeBase: CompetencesDeBase[]
  groupesCompetencesSpecifiques: any[]
  environnementsTravail: any[]
  themes: Theme[]
  mobilitesProchesVersMetiers: MobilitesProchesVersMetier[]
  mobilitesEvolutionsVersMetiers: MobilitesEvolutionsVersMetier[]
  mobilitesProchesVersAppellations: any[]
  mobilitesEvolutionsVersAppellations: any[]
  mobilitesProchesAppellationsVersMetiers: any[]
  mobilitesEvolutionsAppellationsVersMetiers: any[]
  mobilitesProchesAppellationsVersAppellations: any[]
  mobilitesEvolutionsAppellationsVersAppellations: any[]
}

export interface IAppelattionDetailsFromAPI {
  code: string
  libelle: string
  libelleCourt: string
  particulier: boolean
  metier: Metier
  environnementsTravail: any[]
  competencesDeBase: CompetencesDeBase[]
  groupesCompetencesSpecifiques: any[]
  appellationEsco: AppellationEsco
}

export interface Metier {
  code: string
  libelle: string
  riasecMajeur: string
  riasecMineur: string
  codeIsco: string
  particulier: boolean
  domaineProfessionnel: DomaineProfessionnel
}

export interface DomaineProfessionnel {
  code: string
  libelle: string
  grandDomaine: GrandDomaine
}

export interface GrandDomaine {
  code: string
  libelle: string
}

export interface CompetencesDeBase {
  code: string
  libelle: string
  noeudCompetence: NoeudCompetence
  typeCompetence: string
  competenceCle: boolean
  frequence: number
  riasecMineur?: string
  riasecMajeur?: string
}

export interface NoeudCompetence {
  code: string
  libelle: string
  racineCompetence: RacineCompetence
}

export interface RacineCompetence {
  code: string
  libelle: string
}

export interface AppellationEsco {
  code: string
  libelle: string
}

export interface Appellation {
  code: string
  libelle: string
  libelleCourt: string
  particulier: boolean
}

export interface Theme {
  code: string
  libelle: string
}

export interface MobilitesProchesVersMetier {
  metierCible: MetierCible
}

export interface MetierCible {
  code: string
  libelle: string
}

export interface MobilitesEvolutionsVersMetier {
  metierCible: MetierCible2
}

export interface MetierCible2 {
  code: string
  libelle: string
}
