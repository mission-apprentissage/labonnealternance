import type { CreateIndexesOptions, IndexSpecification, SearchIndexDescription } from "mongodb"
import type { ZodType } from "zod"

export interface IModelDescriptor<CollectionName = string, LocalZodType = ZodType> {
  zod: LocalZodType
  indexes: [IndexSpecification, CreateIndexesOptions][]
  searchIndexes?: SearchIndexDescription[]
  collectionName: CollectionName
  authorizeAdditionalProperties?: boolean
}

export { zObjectId } from "zod-mongodb-schema"
