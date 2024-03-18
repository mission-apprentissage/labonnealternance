import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { isNonEmptyString } from "../../../../utils/strutils"

export default function isCandidatureLba(item) {
  const kind: LBA_ITEM_TYPE_OLD = item?.ideaType
  return [LBA_ITEM_TYPE_OLD.LBA, LBA_ITEM_TYPE_OLD.MATCHA].includes(kind) && isNonEmptyString(item?.contact?.email)
}
