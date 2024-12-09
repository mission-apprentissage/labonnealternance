import { assertUnreachable } from "@/../shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

export default function getActualTitle({ selectedItem, kind }) {
  switch (kind) {
    case LBA_ITEM_TYPE_OLD.FORMATION:
      return selectedItem?.title || selectedItem?.longTitle
    case LBA_ITEM_TYPE_OLD.MATCHA:
    case LBA_ITEM_TYPE_OLD.PARTNER_JOB:
    case LBA_ITEM_TYPE_OLD.PEJOB:
      return selectedItem?.title
    case LBA_ITEM_TYPE_OLD.LBA:
      return selectedItem?.nafs[0]?.label
    default:
      assertUnreachable("shouldNotHappen" as never)
  }
}
