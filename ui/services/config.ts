import { assertUnreachable } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { getValueFromPath } from "../utils/tools"

type QueryParameterType = "matcha" | "lbb" | "lba"
/**
 *
 * KBA 6/03/2024 : to remove once migration as been made to API V2 through API apprentissage
 */
const convertTypeForMigration = (type: QueryParameterType) => {
  switch (type) {
    case "matcha":
      return LBA_ITEM_TYPE_OLD.MATCHA

    case "lba":
    case "lbb":
      return LBA_ITEM_TYPE_OLD.LBA

    default:
      assertUnreachable(type)
      break
  }
}

export const initPostulerParametersFromQuery = () => {
  const caller = getValueFromPath("caller") // ex : diagoriente
  const itemId = getValueFromPath("itemId")
  const type = getValueFromPath("type") as QueryParameterType

  if (!caller) {
    throw new Error("missing_caller_parameter")
  }
  if (!itemId) {
    throw new Error("missing_item_id_parameter")
  }
  if (!type) {
    throw new Error("missing_type_parameter")
  }

  return {
    caller,
    itemId,
    type: convertTypeForMigration(type),
  }
}
