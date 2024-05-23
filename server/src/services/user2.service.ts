import Boom from "boom"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { AccessStatus } from "shared/models/roleManagement.model"
import { IUserWithAccount, IUserStatusEvent, UserEventType } from "shared/models/userWithAccount.model"
import { getLastStatusEvent } from "shared/utils"

import { RoleManagement, UserWithAccount } from "@/common/model"
import { ObjectId } from "@/common/mongodb"

export const createUser2IfNotExist = async (
  userProps: Omit<IUserWithAccount, "_id" | "createdAt" | "updatedAt" | "status">,
  is_email_checked: boolean,
  grantedBy: string
): Promise<IUserWithAccount> => {
  const { first_name, last_name, last_action_date, origin, phone } = userProps
  const formatedEmail = userProps.email.toLocaleLowerCase()

  let user = await UserWithAccount.findOne({ email: formatedEmail }).lean()
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
    const userFields: Omit<IUserWithAccount, "createdAt" | "updatedAt"> = {
      _id: id,
      email: formatedEmail,
      first_name,
      last_name,
      phone: phone ?? "",
      last_action_date: last_action_date ?? new Date(),
      origin,
      status,
    }
    user = (await UserWithAccount.create(userFields)).toObject()
  }
  return user
}

export const validateUserWithAccountEmail = async (id: string): Promise<IUserWithAccount> => {
  const userOpt = await UserWithAccount.findOne({ _id: id }).lean()
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
  const newUser = await UserWithAccount.findOneAndUpdate({ _id: id }, { $push: { status: event } }, { new: true }).lean()
  if (!newUser) {
    throw Boom.internal(`utilisateur avec id=${id} non trouvé`)
  }
  return newUser
}

export const activateUser = async (user: IUserWithAccount, granted_by: string): Promise<IUserWithAccount> => {
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
  const newUser = await UserWithAccount.findOneAndUpdate({ _id: user._id }, { $push: { status: event } }, { new: true }).lean()
  if (!newUser) {
    throw Boom.internal(`utilisateur avec id=${user._id} non trouvé`)
  }
  return newUser
}

export const getUserWithAccountByEmail = async (email: string): Promise<IUserWithAccount | null> => UserWithAccount.findOne({ email: email.toLocaleLowerCase() }).lean()

export const emailHasActiveRole = async (email: string) => {
  const userOpt = await getUserWithAccountByEmail(email)
  if (!userOpt) return
  const roles = await RoleManagement.find({ user_id: userOpt._id }).lean()
  const activeStatus = [AccessStatus.GRANTED, AccessStatus.AWAITING_VALIDATION]
  const activeRoles = roles.filter((role) => {
    const roleStatus = getLastStatusEvent(role.status)?.status
    return roleStatus ? activeStatus.includes(roleStatus) : false
  })
  return Boolean(activeRoles.length)
}

export const isUserEmailChecked = (user: IUserWithAccount): boolean => user.status.some((event) => event.status === UserEventType.VALIDATION_EMAIL)

const activationStatus = [UserEventType.ACTIF, UserEventType.DESACTIVE]
export const isUserDisabled = (user: IUserWithAccount): boolean =>
  getLastStatusEvent(user.status.filter((event) => activationStatus.includes(event.status)))?.status === UserEventType.DESACTIVE
