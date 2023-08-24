import { ILbaCompany } from "../lbaCompany/lbaCompany.types.js"

interface IUnsubscribedCompany extends ILbaCompany {
  unsubscribe_date: Date
  unsubscribe_reason: string
}

export { IUnsubscribedCompany }
