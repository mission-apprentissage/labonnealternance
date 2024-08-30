import { ObjectId } from "bson"

import { IUserWithAccount } from "../models"

export function generateUserWithAccountFixture(data: Partial<IUserWithAccount>): IUserWithAccount {
  return {
    _id: new ObjectId(),
    status: [],
    first_name: "John",
    last_name: "Doe",
    email: "user@mail.com",
    phone: "0600000000",

    createdAt: new Date("2021-01-28T15:00:00.000Z"),
    updatedAt: new Date("2021-01-28T15:00:00.000Z"),

    ...data,
  }
}
