import { ObjectId } from "bson"
import type { CreateIndexesOptions, IndexSpecification, SearchIndexDescription } from "mongodb"
import type { ZodType } from "zod"

import { z } from "../helpers/zod-with-open-api.js"

export interface IModelDescriptor<CollectionName = string, LocalZodType = ZodType> {
  zod: LocalZodType
  indexes: [IndexSpecification, CreateIndexesOptions][]
  searchIndexes?: SearchIndexDescription[]
  collectionName: CollectionName
  authorizeAdditionalProperties?: boolean
}

// z.codec() rather than zod-mongodb-schema's zObjectId (a one-way `.transform()`):
// fastify-type-provider-zod@7's encode-based response serialization throws "Encountered
// unidirectional transform during encode" on a raw ObjectId. Same contract: string|ObjectId in, ObjectId out.
// z.custom() + ObjectId.isValid() rather than z.instanceof(ObjectId): "bson" can resolve to more
// than one module instance across workspaces/test runners (Vitest vs Node), and a valid
// driver-returned ObjectId may then fail `instanceof` against this file's class.
export const zObjectId = z.codec(
  z.custom<string | ObjectId>((value) => ObjectId.isValid(value as string | ObjectId)),
  z.custom<ObjectId>((value) => ObjectId.isValid(value as ObjectId)),
  {
    decode: (value) => new ObjectId(value),
    encode: (value) => value.toString(),
  }
)
