import { badRequest, internal } from "@hapi/boom"
import { ObjectId } from "mongodb"
import { INewSuperUser } from "shared"
import { ADMIN, OPCO } from "shared/constants"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { AccessStatus } from "shared/models/roleManagement.model"
import { IUserStatusEvent, IUserWithAccount, UserEventType } from "shared/models/userWithAccount.model"
import { assertUnreachable, getLastStatusEvent } from "shared/utils"

import { createAdminUser, createOpcoUser } from "@/services/userRecruteur.service"

import { getDbCollection } from "../common/utils/mongodbUtils"

export const createUser2IfNotExist = async (
  userProps: Omit<IUserWithAccount, "_id" | "createdAt" | "updatedAt" | "status">,
  is_email_checked: boolean,
  grantedBy: string
): Promise<IUserWithAccount> => {
  const { first_name, last_name, last_action_date, origin, phone } = userProps
  const formatedEmail = userProps.email.toLocaleLowerCase()

  let user = await getDbCollection("userswithaccounts").findOne({ email: formatedEmail })
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
    const now = new Date()
    const userFields: IUserWithAccount = {
      _id: id,
      email: formatedEmail,
      first_name,
      last_name,
      phone: phone ?? "",
      last_action_date: last_action_date ?? new Date(),
      origin,
      status,
      createdAt: now,
      updatedAt: now,
    }
    await getDbCollection("userswithaccounts").insertOne(userFields)
    user = userFields
  }
  return user
}

export const validateUserWithAccountEmail = async (id: IUserWithAccount["_id"]): Promise<IUserWithAccount> => {
  const userOpt = await getDbCollection("userswithaccounts").findOne({ _id: id })
  if (!userOpt) {
    throw internal(`utilisateur avec id=${id} non trouvé`)
  }
  if (isUserEmailChecked(userOpt)) {
    return userOpt
  }
  const event: IUserStatusEvent = {
    date: new Date(),
    status: UserEventType.VALIDATION_EMAIL,
    validation_type: VALIDATION_UTILISATEUR.MANUAL,
    granted_by: id.toString(),
    reason: "validation de l'email par l'utilisateur",
  }
  const newUser = await getDbCollection("userswithaccounts").findOneAndUpdate(
    { _id: id },
    { $push: { status: event }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" }
  )
  if (!newUser) {
    throw internal(`utilisateur avec id=${id} non trouvé`)
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
  const newUser = await getDbCollection("userswithaccounts").findOneAndUpdate(
    { _id: user._id },
    { $push: { status: event }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" }
  )
  if (!newUser) {
    throw internal(`utilisateur avec id=${user._id} non trouvé`)
  }
  return newUser
}

export const getUserWithAccountByEmail = async (email: string): Promise<IUserWithAccount | null> =>
  getDbCollection("userswithaccounts").findOne({ email: email.toLocaleLowerCase() })

export const emailHasActiveRole = async (email: string): Promise<boolean> => {
  const userOpt = await getUserWithAccountByEmail(email)
  if (!userOpt) return false
  const roles = await getDbCollection("rolemanagements").find({ user_id: userOpt._id }).toArray()
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

export const createSuperUser = async (userFields: INewSuperUser, { grantedBy, origin }: { grantedBy: string; origin: string }) => {
  const { email, type } = userFields
  if (await emailHasActiveRole(email)) {
    throw badRequest(`User ${email} already have an active role`)
  }
  const reason = ""

  if (type === ADMIN) {
    const user = await createAdminUser(userFields, { grantedBy, origin, reason })
    return user
  } else if (type === OPCO) {
    const { opco } = userFields
    const user = await createOpcoUser(userFields, opco, { grantedBy, origin, reason })
    return user
  } else {
    assertUnreachable(type)
  }
}
