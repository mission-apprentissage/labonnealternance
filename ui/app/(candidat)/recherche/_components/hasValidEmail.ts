import { ILbaItemJobsGlobal } from "shared"

import { isNonEmptyString } from "@/utils/strutils"

export function hasValidEmail(item: ILbaItemJobsGlobal) {
  const { contact } = item
  return isNonEmptyString(contact?.email)
}
