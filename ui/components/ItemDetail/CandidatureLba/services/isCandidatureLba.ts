import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { isNonEmptyString } from "../../../../utils/strutils"

export default function isCandidatureLba(item) {
  const kind: LBA_ITEM_TYPE = item?.ideaType
  return [LBA_ITEM_TYPE.RECRUTEURS_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA].includes(kind) && isNonEmptyString(item?.contact?.email)
}
