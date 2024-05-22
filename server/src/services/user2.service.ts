import Boom from "boom"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { AccessStatus } from "shared/models/roleManagement.model"
import { IUser2, IUserStatusEvent, UserEventType } from "shared/models/user2.model"
import { getLastStatusEvent } from "shared/utils"

import { RoleManagement, User2 } from "@/common/model"
import { ObjectId } from "@/common/mongodb"

export const createUser2IfNotExist = async (
  userProps: Omit<IUser2, "_id" | "createdAt" | "updatedAt" | "status">,
  is_email_checked: boolean,
  grantedBy: string
): Promise<IUser2> => {
  const { first_name, last_name, last_action_date, origin, phone } = userProps
  const formatedEmail = userProps.email.toLocaleLowerCase()

  let user = await User2.findOne({ email: formatedEmail }).lean()
  if (!user) {
    const id = new ObjectId()
    grantedBy = grantedBy || id.toString()
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
    const userFields: Omit<IUser2, "createdAt" | "updatedAt"> = {
      _id: id,
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

export const activateUser = async (user: IUser2, granted_by: string): Promise<IUser2> => {
  if (!isUserDisabled(user)) {
    return user
  }
  const event: IUserStatusEvent = {
    date: new Date(),
    status: UserEventType.ACTIF,
    validation_type: VALIDATION_UTILISATEUR.MANUAL,
    granted_by,
    reason: "",
  }
  const newUser = await User2.findOneAndUpdate({ _id: user._id }, { $push: { status: event } }, { new: true }).lean()
  if (!newUser) {
    throw Boom.internal(`utilisateur avec id=${user._id} non trouvé`)
  }
  return newUser
}

export const getUser2ByEmail = async (email: string): Promise<IUser2 | null> => User2.findOne({ email: email.toLocaleLowerCase() }).lean()

export const emailHasActiveRole = async (email: string) => {
  const userOpt = await getUser2ByEmail(email)
  if (!userOpt) return
  const roles = await RoleManagement.find({ user_id: userOpt._id }).lean()
  const activeStatus = [AccessStatus.GRANTED, AccessStatus.AWAITING_VALIDATION]
  const activeRoles = roles.filter((role) => {
    const roleStatus = getLastStatusEvent(role.status)?.status
    return roleStatus ? activeStatus.includes(roleStatus) : false
  })
  return Boolean(activeRoles.length)
}

export const isUserEmailChecked = (user: IUser2): boolean => user.status.some((event) => event.status === UserEventType.VALIDATION_EMAIL)

const activationStatus = [UserEventType.ACTIF, UserEventType.DESACTIVE]
export const isUserDisabled = (user: IUser2): boolean =>
  getLastStatusEvent(user.status.filter((event) => activationStatus.includes(event.status)))?.status === UserEventType.DESACTIVE
