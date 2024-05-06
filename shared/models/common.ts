import type { CreateIndexesOptions, IndexSpecification } from "mongodb"
import { ZodType } from "zod"

export type CollectionName = "users" | "jobs" | "organisations" | "persons" | "events" | "sessions" | "documents" | "documentContents" | "mailingLists"

export interface IModelDescriptor {
  zod: ZodType
  indexes: [IndexSpecification, CreateIndexesOptions][]
  collectionName: CollectionName
}

export { zObjectId } from "zod-mongodb-schema"
