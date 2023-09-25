import { IRecruiter } from "shared"

export interface ILbaJobEsResult {
  _source: Partial<IRecruiter>
  sort?: number[]
  _id?: string
}
