import BSON, { type ObjectId } from "bson"
import type { IndexOptions, IndexSpecification } from "mongodb"
import { ZodType, z } from "zod"

export type CollectionName = "users" | "jobs" | "organisations" | "persons" | "events" | "sessions" | "documents" | "documentContents" | "mailingLists"

export interface IModelDescriptor {
  zod: ZodType
  indexes: [IndexSpecification, IndexOptions][]
  collectionName: CollectionName
}

export const zObjectId = z
  .custom<ObjectId | string>((v) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return BSON.ObjectID.isValid(v as any)
  })
  .transform((v) => new BSON.ObjectID(v))
  .describe("Identifiant unique")
