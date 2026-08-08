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

// zod-mongodb-schema's zObjectId is a one-way `.transform()` pipe (string|ObjectId -> ObjectId):
// it has no defined `encode` direction, so fastify-type-provider-zod@7's encode-based response
// serialization throws "Encountered unidirectional transform during encode" whenever a raw
// ObjectId flows through a response schema built with it. z.codec() defines both directions
// explicitly, preserving the exact same input/output type contract (string|ObjectId in, ObjectId out).
// Uses z.custom() + ObjectId.isValid() rather than z.instanceof(ObjectId) on purpose: in this
// Yarn workspaces monorepo, "bson" can resolve to more than one module instance across
// workspaces/test runners (e.g. Vitest's own dependency resolution vs. Node's), and a real
// MongoDB-driver-returned ObjectId may then fail a strict `instanceof` check against *this*
// file's imported class even though it is a perfectly valid ObjectId. isValid() duck-types instead.
export const zObjectId = z.codec(
  z.custom<string | ObjectId>((value) => ObjectId.isValid(value as string | ObjectId)),
  z.custom<ObjectId>((value) => ObjectId.isValid(value as ObjectId)),
  {
    decode: (value) => new ObjectId(value),
    encode: (value) => value.toString(),
  }
)
