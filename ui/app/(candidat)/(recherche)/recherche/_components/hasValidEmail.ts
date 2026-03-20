import type { ILbaItemJobsGlobal } from "shared"

export function hasValidEmail(item: ILbaItemJobsGlobal) {
  return !!item?.contact?.hasEmail
}
