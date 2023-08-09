import { IRecruiter } from "../db/schema/recruiter/recruiter.types.js"

export interface ILbaJobEsResult {
  _source: Partial<IRecruiter>
  sort?: number[]
  _id?: string
}
