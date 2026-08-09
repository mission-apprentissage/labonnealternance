import type { ILbaItemLbaCompanyJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { apiGet } from "@/utils/api.utils"

const fetchLbaCompanyDetails = async (company: { id: string }): Promise<ILbaItemLbaCompanyJson> => {
  const lbaCompany: ILbaItemLbaCompanyJson = (await apiGet("/_private/jobs/:source/:id", {
    params: { id: company.id, source: LBA_ITEM_TYPE.RECRUTEURS_LBA },
  })) as ILbaItemLbaCompanyJson

  if (lbaCompany) {
    return lbaCompany
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchLbaCompanyDetails
