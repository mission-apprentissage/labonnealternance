import { IFormationCatalogue } from "../common/model/schema/formationCatalogue/formationCatalogue.types"

export interface IFormationEsResult {
  source: Partial<IFormationCatalogue>
  sort?: number[]
  id?: string
}
