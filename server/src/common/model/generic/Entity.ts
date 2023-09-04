import { randomUUID as uuid } from "crypto"

export type Entity = {
  id: string
  createdAt: Date
  updatedAt: Date
}

export const Entity = {
  new(): Entity {
    const now = new Date()
    return {
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    }
  },
}
