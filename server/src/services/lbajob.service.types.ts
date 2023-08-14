import { IRecruiter } from "../common/model/schema/recruiter/recruiter.types.js"

export interface ILbaJobEsResult {
  _source: Partial<IRecruiter>
  sort?: number[]
  _id?: string
}
