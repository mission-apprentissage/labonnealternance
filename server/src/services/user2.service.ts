import Boom from "boom"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { IUser2, IUserStatusEvent, UserEventType } from "shared/models/user2.model"

import { User2 } from "@/common/model"

import { isUserEmailChecked } from "./userRecruteur.service"

export const createUser2IfNotExist = async (
  userProps: Omit<IUser2, "_id" | "createdAt" | "updatedAt" | "status">,
  is_email_checked: boolean,
  grantedBy: string
): Promise<IUser2> => {
  const { first_name, last_name, last_action_date, origin, phone } = userProps
  const formatedEmail = userProps.email.toLocaleLowerCase()

  let user = await User2.findOne({ email: formatedEmail }).lean()
  if (!user) {
    const status: IUserStatusEvent[] = []
    if (is_email_checked) {
      status.push({
        date: new Date(),
        reason: "validation de l'email à la création",
        status: UserEventType.VALIDATION_EMAIL,
        validation_type: VALIDATION_UTILISATEUR.MANUAL,
        granted_by: grantedBy,
      })
    }
    status.push({
      date: new Date(),
      reason: "creation de l'utilisateur",
      status: UserEventType.ACTIF,
      validation_type: VALIDATION_UTILISATEUR.MANUAL,
      granted_by: grantedBy,
    })
    const userFields: Omit<IUser2, "_id" | "createdAt" | "updatedAt"> = {
      email: formatedEmail,
      first_name,
      last_name,
      phone: phone ?? "",
      last_action_date: last_action_date ?? new Date(),
      origin,
      status,
    }
    user = (await User2.create(userFields)).toObject()
  }
  return user
}

export const validateUser2Email = async (id: string): Promise<IUser2> => {
  const userOpt = await User2.findOne({ _id: id }).lean()
  if (!userOpt) {
    throw Boom.internal(`utilisateur avec id=${id} non trouvé`)
  }
  if (isUserEmailChecked(userOpt)) {
    return userOpt
  }
  const event: IUserStatusEvent = {
    date: new Date(),
    status: UserEventType.VALIDATION_EMAIL,
    validation_type: VALIDATION_UTILISATEUR.MANUAL,
    granted_by: id,
    reason: "validation de l'email par l'utilisateur",
  }
  const newUser = await User2.findOneAndUpdate({ _id: id }, { $push: { status: event } }, { new: true }).lean()
  if (!newUser) {
    throw Boom.internal(`utilisateur avec id=${id} non trouvé`)
  }
  return newUser
}

export const getUser2ByEmail = async (email: string): Promise<IUser2 | null> => User2.findOne({ email: email.toLocaleLowerCase() }).lean()
