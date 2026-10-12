import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { JOB_STATUS, JOB_STATUS_ENGLISH } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { isOfferExpired } from "shared/utils/offer-expiration"

export function isOfferActive(item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson): boolean {
  if (item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    return item.status === JOB_STATUS_ENGLISH.ACTIVE
  } else {
    return "job" in item && item.job?.status === JOB_STATUS.ACTIVE && !isOfferExpired(item.job.jobExpirationDate)
  }
}
