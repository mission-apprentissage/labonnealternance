import { ILbaItemFormation2, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "@/../shared"

import { endsWithNumber } from "@/utils/strutils"

export const getCompanySize = (item: ILbaItemLbaJob | ILbaItemLbaCompany | ILbaItemFtJob | ILbaItemFormation2) => {
  let companySize = item?.company?.size?.toLowerCase()
  if (!companySize) {
    companySize = "non renseigné"
  } else if (companySize.startsWith("0")) {
    companySize = "0 à 9 salariés"
  }
  if (endsWithNumber(companySize)) {
    companySize += " salariés"
  }

  return companySize
}
