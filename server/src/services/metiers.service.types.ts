import type { IMetierEnrichi, IRomeWithLabel, IMetiers, IMetiersEnrichis } from "shared"

export type { IMetierEnrichi, IRomeWithLabel, IMetiers, IMetiersEnrichis }

export interface IAppellationsRomes {
  coupleAppellationRomeMetier: IAppellationRome[]
}

export interface IAppellationRome {
  codeRome: string
  intitule: string
  appellation: string
}
