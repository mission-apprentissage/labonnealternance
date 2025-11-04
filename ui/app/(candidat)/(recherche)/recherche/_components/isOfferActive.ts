import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { JOB_STATUS } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

export function isOfferActive(item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson): boolean {
  return item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA || ("job" in item && item.job?.status === JOB_STATUS.ACTIVE)
}
