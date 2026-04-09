import type { ILbaItemJobsGlobal } from "shared"

export function hasEmail(item: ILbaItemJobsGlobal) {
  return Boolean(item.contact?.hasEmail)
}
