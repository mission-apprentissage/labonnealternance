import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

export const getItemId = (item) => {
  return getItemIdAndType(item).itemId
}

export * from "shared/validators/siretValidator"

export const getItemIdAndType = (item) => {
  const itemId = item.id
  const type = item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? "training" : item.ideaType

  return { itemId, type }
}

export const getItemQueryParameters = (item) => {
  const idAndType = getItemIdAndType(item)
  return `type=${idAndType.type}&itemId=${encodeURIComponent(idAndType.itemId)}`
}
