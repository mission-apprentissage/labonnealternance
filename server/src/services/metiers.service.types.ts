export type IMetiers = {
  metiers: string[]
}

export interface IRomeWithLabel {
  codeRome: string
  intitule: string
}

export interface IMetierEnrichi {
  label: string
  romes: string[]
  rncps?: string[]
  type?: string
  romeTitles?: IRomeWithLabel[]
}

export interface IMetiersEnrichis {
  labelsAndRomes?: IMetierEnrichi[]
  labelsAndRomesForDiplomas?: IMetierEnrichi[]
}

export interface IAppellationsRomes {
  coupleAppellationRomeMetier: IAppellationRome[]
}

export interface IAppellationRome {
  codeRome: string
  intitule: string
  appellation: string
}
