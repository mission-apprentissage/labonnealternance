import { ObjectId } from "bson"

import { ICFA } from "../models/cfa.model"

export function generateCfaFixture(data: Partial<ICFA>): ICFA {
  return {
    _id: new ObjectId(),
    siret: "78430824900019",

    createdAt: new Date("2021-01-28T15:00:00.000Z"),
    updatedAt: new Date("2021-01-28T15:00:00.000Z"),

    ...data,
  }
}
