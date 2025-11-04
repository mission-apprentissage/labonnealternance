import type { ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { apiGet } from "@/utils/api.utils"

const fetchPartnerJobDetails = async (job: { id: string }): Promise<ILbaItemPartnerJobJson> => {
  const partnerJob: ILbaItemPartnerJobJson = (await apiGet("/_private/jobs/:source/:id", {
    params: { id: job.id, source: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES },
  })) as ILbaItemPartnerJobJson

  if (partnerJob) {
    return partnerJob
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchPartnerJobDetails
