import { isNonEmptyString } from "../../../../utils/strutils"
import { amongst } from "../../../../utils/arrayutils"

export default function isCandidatureLba(item) {
  const kind = item?.ideaType
  return amongst(kind, ["lbb", "lba", "matcha"]) && isNonEmptyString(item?.contact?.email)
}
