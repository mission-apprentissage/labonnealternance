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

export interface IMetiersEnrichis {
  labelsAndRomes?: IMetierEnrichi[]
  labelsAndRomesForDiplomas?: IMetierEnrichi[]
  error?: string
  error_messages?: string[]
}

export interface IAppellationsRomes {
  coupleAppellationRomeMetier?: IAppellationRome[]
  error?: string
  error_messages?: string[]
}

export interface IAppellationRome {
  codeRome: string
  intitule: string
  appellation: string
}
