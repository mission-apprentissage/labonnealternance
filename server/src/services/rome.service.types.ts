import { TDayjs } from "./dayjs.service"

export interface IFTAPIToken {
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

export interface IRomeV4Short {
  code: string
}

interface IRomeV4Item {
  code: string
  libelle: string
  type?: string
  categorie?: string
}

interface IRomeV4Competence {
  type: string
  code: string
  libelle: string
  codeOgr: string
  riasecMajeur?: string
  riasecMineur?: string
}

interface IRomeV4Appellation {
  code: string
  libelle: string
  libelleCourt: string
  classification?: string
  competencesCles?: any[]
}

interface IRomeV4SecteurActivite {
  code: string
  libelle: string
  secteurActivite: IRomeV4Item
}

export interface IRomeV4DetailsFromAPI {
  obsolete: boolean
  code: string
  libelle: string
  definition: string
  accesEmploi: string
  riasecMajeur: string
  riasecMineur: string
  codeIsco: string
  domaineProfessionnel: DomaineProfessionnel
  appellations: IRomeV4Appellation[]
  themes: IRomeV4Item[]
  centresInterets: any[]
  secteursActivites: IRomeV4SecteurActivite[]
  competencesMobilisees: IRomeV4Competence[]
  competencesMobiliseesPrincipales: IRomeV4Competence[]
  competencesMobiliseesEmergentes: IRomeV4Competence[]
  divisionsNaf: IRomeV4Item[]
  formacodes: IRomeV4Item[]
  contextesTravail: IRomeV4Item[]
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
  riasecMineur?: string | null
  riasecMajeur?: string | null
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
