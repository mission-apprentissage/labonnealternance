import { amongst } from "../../../../utils/arrayutils"
import { isNonEmptyString } from "../../../../utils/strutils"

export default function isCandidatureSpontanee(item) {
  const kind = item?.ideaType
  return amongst(kind, ["lbb", "lba", "matcha"]) && isNonEmptyString(item?.contact?.email)
}
