import { ObjectId } from "bson"

import { EApplicantRole, EApplicantType } from "../constants/rdva.js"
import { IUser } from "../models/user.model.js"

export function generateUserFixture(data: Partial<IUser> = {}): IUser {
  return {
    _id: new ObjectId(),
    firstname: "John",
    lastname: "Doe",
    email: "user@mail.com",
    phone: "0600000000",
    last_action_date: new Date("2021-01-28T15:00:00.000Z"),
    role: EApplicantRole.CANDIDAT,
    type: EApplicantType.ETUDIANT,

    ...data,
  }
}
