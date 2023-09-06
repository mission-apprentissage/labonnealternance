import { IBonneBoite } from "../bonneboite/bonneboite.types"

interface IUnsubscribedBonneBoite extends IBonneBoite {
  unsubscribe_date: Date
  unsubscribe_reason: string
}

export { IUnsubscribedBonneBoite }
