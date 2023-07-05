import { IBonneBoite } from "../bonneboite/bonneboite.types.js"

interface IUnsubscribedBonneBoite extends IBonneBoite {
  unsubscribe_date: Date
  unsubscribe_reason: string
}

export { IUnsubscribedBonneBoite }
