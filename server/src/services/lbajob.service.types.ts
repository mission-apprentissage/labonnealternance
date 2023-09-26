import { IRecruiter } from "shared"

export interface ILbaJobEsResult {
  _source: IRecruiter
  sort?: number[]
  _id?: string
}
