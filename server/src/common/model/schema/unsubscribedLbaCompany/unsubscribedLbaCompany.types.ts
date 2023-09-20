import { ILbaCompany } from "../lbaCompany/lbaCompany.types.js"

interface IUnsubscribedLbaCompany extends ILbaCompany {
  unsubscribe_date: Date
  unsubscribe_reason: string
}

export type { IUnsubscribedLbaCompany }
