import { IFormationCatalogue } from "../db/schema/formationCatalogue/formationCatalogue.types.js"

export interface IFormationEsResult {
  source: Partial<IFormationCatalogue>
  sort?: number[]
  id?: string
}
