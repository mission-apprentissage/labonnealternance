export interface IReferentielRome {
  numero: string
  rome: IRome
  appellations: IAppellation[]
  definition: string
  acces_metier: string
  competences: ICompetence
  contextes_travail: IContextesTravail[]
  mobilites: IMobilite[]
}

interface IRome {
  code_rome: string
  intitule: string
  code_ogr: string
}

interface IAppellation {
  libelle: string
  libelle_court: string
  code_ogr: string
}

interface ICompetence {
  savoir_faire: ISavoirFaire[]
  savoir_etre_professionnel: ISavoirEtreProfessionnel[]
  savoirs: ISavoir[]
}

interface IContextesTravail {
  libelle: string
  items: Item[]
}

interface IMobilite {
  proche: IMobiliteItem[]
  si_evolution: IMobiliteItem[]
}

interface ISavoirFaire {
  libelle: string
  items: Item[]
}

interface ISavoirEtreProfessionnel {
  libelle: string
  items: Item[]
}

interface ISavoir {
  libelle: string
  items: Item[]
}

interface Item {
  libelle: string
  code_ogr: string
}
export interface IMobiliteItem {
  appellation_source: string
  code_ogr_appellation_source: string
  rome_cible: string
  code_org_rome_cible: string
  appellation_cible: string
  code_ogr_appellation_cible: string
}
