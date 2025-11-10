import type { ILbaItemFormation2Json, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson } from "shared"

import { endsWithNumber } from "@/utils/strutils"

export const getCompanySize = (item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemFtJobJson | ILbaItemFormation2Json) => {
  let companySize = item?.company?.size?.toLowerCase()
  if (!companySize || companySize === "non diffusé") {
    companySize = "non renseignée"
  } else if (companySize.startsWith("0")) {
    companySize = "0 à 9 salariés"
  }
  if (endsWithNumber(companySize)) {
    companySize += " salariés"
  }

  return companySize
}
