import { ObjectId } from "bson"

import { VALIDATION_UTILISATEUR } from "../constants"
import { IUserStatusEvent, IUserWithAccount, UserEventType } from "../models"

export function generateUserWithAccountFixture(data: Partial<IUserWithAccount>): IUserWithAccount {
  return {
    _id: new ObjectId(),
    status: [
      generateUserStatusEventFixture({
        status: UserEventType.ACTIF,
      }),
      generateUserStatusEventFixture({
        status: UserEventType.VALIDATION_EMAIL,
      }),
    ],
    first_name: "John",
    last_name: "Doe",
    email: "user@mail.com",
    phone: "0600000000",

    createdAt: new Date("2021-01-28T15:00:00.000Z"),
    updatedAt: new Date("2021-01-28T15:00:00.000Z"),

    ...data,
  }
}

export const generateUserStatusEventFixture = (props: Partial<IUserStatusEvent> = {}): IUserStatusEvent => {
  return {
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    status: UserEventType.ACTIF,
    reason: "reason",
    date: new Date("2021-01-28T15:00:00.000Z"),
    ...props,
  }
}
