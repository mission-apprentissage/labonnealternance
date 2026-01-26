import type { CreateIndexesOptions, IndexSpecification } from "mongodb"
import type { ZodType } from "zod"

export interface IModelDescriptor<CollectionName = string, LocalZodType = ZodType> {
  zod: LocalZodType
  indexes: [IndexSpecification, CreateIndexesOptions][]
  collectionName: CollectionName
  authorizeAdditionalProperties?: boolean
}

export { zObjectId } from "zod-mongodb-schema"
