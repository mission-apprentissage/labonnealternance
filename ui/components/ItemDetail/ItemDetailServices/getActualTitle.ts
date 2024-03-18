import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

export default function getActualTitle({ selectedItem, kind }) {
  let title = ""

  if (kind === LBA_ITEM_TYPE_OLD.FORMATION) {
    title = selectedItem?.title || selectedItem?.longTitle
  } else if (kind === LBA_ITEM_TYPE_OLD.MATCHA) {
    title = selectedItem?.title
  } else if (kind === LBA_ITEM_TYPE_OLD.PEJOB) {
    title = selectedItem?.title
  } else {
    // lba / lbb
    title = selectedItem?.nafs[0]?.label
  }

  return title
}
