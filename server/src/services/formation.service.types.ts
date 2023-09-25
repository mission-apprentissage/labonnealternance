import { IFormationCatalogue } from "shared"

export interface IFormationEsResult {
  source: Partial<IFormationCatalogue>
  sort?: number[]
  id?: string
}
