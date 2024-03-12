import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

export const getItemId = (item) => {
  return getItemIdAndType(item).itemId
}

export * from "shared/validators/siretValidator"

export const getItemIdAndType = (item) => {
  let itemId = item.id
  let type = "training"
  const kind: LBA_ITEM_TYPE = item.ideaType

  if (kind !== LBA_ITEM_TYPE.FORMATION) {
    type = kind
  }

  if (!item.directId) {
    if (kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
      itemId = item.job.id
    } else if (kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
      itemId = item.job.id
    } else if (kind !== LBA_ITEM_TYPE.FORMATION) {
      itemId = item?.company?.siret || "siret"
    }
  }

  return { itemId, type }
}

export const getItemQueryParameters = (item) => {
  const idAndType = getItemIdAndType(item)
  return `type=${idAndType.type}&itemId=${encodeURIComponent(idAndType.itemId)}`
}
