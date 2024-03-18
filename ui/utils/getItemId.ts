import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

export const getItemId = (item) => {
  return getItemIdAndType(item).itemId
}

export * from "shared/validators/siretValidator"

export const getItemIdAndType = (item) => {
  let itemId = item.id
  let type = "training"
  const kind: LBA_ITEM_TYPE_OLD = item.ideaType

  if (kind !== LBA_ITEM_TYPE_OLD.FORMATION) {
    type = kind
  }

  if (!item.directId) {
    if (kind === LBA_ITEM_TYPE_OLD.PE) {
      itemId = item.job.id
    } else if (kind === LBA_ITEM_TYPE_OLD.MATCHA) {
      itemId = item.job.id
    } else if (kind !== LBA_ITEM_TYPE_OLD.FORMATION) {
      itemId = item?.company?.siret || "siret"
    }
  }

  return { itemId, type }
}

export const getItemQueryParameters = (item) => {
  const idAndType = getItemIdAndType(item)
  return `type=${idAndType.type}&itemId=${encodeURIComponent(idAndType.itemId)}`
}
