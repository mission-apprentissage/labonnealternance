import { CreateIndexesOptions, IndexSpecification, ObjectId } from "mongodb"
import { ZodType, z } from "zod"

export type CollectionName = "users" | "jobs" | "organisations" | "persons" | "events" | "sessions" | "documents" | "documentContents" | "mailingLists"

export interface IModelDescriptor {
  zod: ZodType
  indexes: [IndexSpecification, CreateIndexesOptions][]
  collectionName: CollectionName
}

export const zObjectId = z
  .custom<ObjectId | string>((v: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ObjectId.isValid(v as any)
  })
  .transform((v: any) => new ObjectId(v))
  .describe("Identifiant unique")
