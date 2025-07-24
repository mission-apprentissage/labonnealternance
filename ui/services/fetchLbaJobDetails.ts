import { ILbaItemLbaJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { apiGet } from "@/utils/api.utils"

const fetchLbaJobDetails = async (job: Pick<ILbaItemLbaJobJson, "id">): Promise<ILbaItemLbaJobJson> => {
  const lbaJob: ILbaItemLbaJobJson = (await apiGet(`/_private/jobs/:source/:id`, { params: { id: job.id, source: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA } })) as ILbaItemLbaJobJson

  if (lbaJob) {
    return lbaJob
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchLbaJobDetails
