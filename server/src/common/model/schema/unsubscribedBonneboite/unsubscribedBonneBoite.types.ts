import { IBonneBoite } from "../bonneboite/bonneboite.types"

export interface IUnsubscribedBonneBoite extends IBonneBoite {
  unsubscribe_date: Date
  unsubscribe_reason: string
}
