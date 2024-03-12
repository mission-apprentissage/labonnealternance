import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

export default function getActualTitle({ selectedItem, kind }) {
  let title = ""

  if (kind === LBA_ITEM_TYPE.FORMATION) {
    title = selectedItem?.title || selectedItem?.longTitle
  } else if (kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    title = selectedItem?.title
  } else if (kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    title = selectedItem?.title
  } else {
    // lba / lbb
    title = selectedItem?.nafs[0]?.label
  }

  return title
}
