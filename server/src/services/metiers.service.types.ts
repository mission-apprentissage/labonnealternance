export interface IMetiers {
  metiers?: string[]
  error?: string
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

export interface IError {
  error: string
  error_messages?: string[]
}

export interface IMetiersEnrichisSuccess {
  labelsAndRomes: IMetierEnrichi[]
}

export interface IMetiersEnrichisForDiplomasSuccess {
  labelsAndRomesForDiplomas: IMetierEnrichi[]
}

export type IMetiersEnrichis = IMetiersEnrichisSuccess | IError
export type IMetiersEnrichisForDiplomas = IMetiersEnrichisForDiplomasSuccess | IError

export interface IAppellationsRomesSuccess {
  coupleAppellationRomeMetier: IAppellationRome[]
}

export type IAppellationsRomes = IAppellationsRomesSuccess | IError

export interface IAppellationRome {
  codeRome: string
  intitule: string
  appellation: string
}
