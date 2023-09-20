import { ObjectId } from "bson"
import type { CreateIndexesOptions, IndexSpecification } from "mongodb"
import { z, ZodType } from "zod"

export type CollectionName = "users" | "jobs" | "organisations" | "persons" | "events" | "sessions" | "documents" | "documentContents" | "mailingLists"

export interface IModelDescriptor {
  zod: ZodType
  indexes: [IndexSpecification, CreateIndexesOptions][]
  collectionName: CollectionName
}

export const zObjectId = z
  .custom<ObjectId | string>((v) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ObjectId.isValid(v as any)
  })
  .transform((v) => new ObjectId(v))
  .describe("Identifiant unique")
