import type { IMetierEnrichi, IMetiers, IMetiersEnrichis, IRomeWithLabel } from "shared"

export type { IMetierEnrichi, IMetiers, IMetiersEnrichis, IRomeWithLabel }

export interface IAppellationsRomes {
  coupleAppellationRomeMetier: IAppellationRome[]
}

export interface IAppellationRome {
  code_rome?: string
  codeRome?: string
  intitule: string
  appellation: string
}
