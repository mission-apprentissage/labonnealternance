import type { ILbaItemFormationJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

export type ILbaItem = ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson | ILbaItemFormationJson | ILbaItemLbaJobJson
