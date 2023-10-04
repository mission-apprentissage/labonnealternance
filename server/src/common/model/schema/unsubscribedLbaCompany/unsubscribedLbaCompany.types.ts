import { ILbaCompany } from "shared"

interface IUnsubscribedLbaCompany extends ILbaCompany {
  unsubscribe_date: Date
  unsubscribe_reason: string
}

export type { IUnsubscribedLbaCompany }
