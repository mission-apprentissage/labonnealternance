import { randomUUID as uuid } from "crypto"

export type Entity = {
  _id: string
  createdAt: Date
  updatedAt: Date
}
