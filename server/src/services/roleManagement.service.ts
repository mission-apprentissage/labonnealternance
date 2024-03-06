import Boom from "boom"
import { ObjectId } from "mongodb"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { RoleManagement } from "@/common/model"

import { ADMIN, CFA, ENTREPRISE, OPCO } from "./constant.service"

export const modifyPermissionToUser = async (
  props: Pick<IRoleManagement, "authorized_id" | "authorized_type" | "user_id" | "origin">,
  eventProps: Pick<IRoleManagementEvent, "reason" | "validation_type" | "granted_by" | "status">
): Promise<IRoleManagement> => {
  const event: IRoleManagementEvent = {
    ...eventProps,
    date: new Date(),
  }
  const { authorized_id, authorized_type, user_id } = props
  const role = await RoleManagement.findOne({ authorized_id, authorized_type, user_id }).lean()
  if (role) {
    const lastEvent = getLastStatusEvent(role.status)
    if (lastEvent?.status === eventProps.status) {
      return role
    }
    const newRole = await RoleManagement.findOneAndUpdate({ _id: role._id }, { $push: { status: event } }, { new: true }).lean()
    if (!newRole) {
      throw Boom.internal("inattendu")
    }
    return newRole
  } else {
    const newRole: Omit<IRoleManagement, "_id" | "updatedAt" | "createdAt"> = {
      ...props,
      status: [event],
    }
    const role = await RoleManagement.create(newRole)
    return role
  }
}

export const getGrantedRoles = async (userId: string) => {
  return RoleManagement.find({ user_id: userId, $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, AccessStatus.GRANTED] } }).lean()
}

// TODO à supprimer lorsque les utilisateurs pourront avoir plusieurs types
export const getUserType = async (userId: string | ObjectId) => {
  const roles = await getGrantedRoles(userId.toString())
  const isAdmin = roles.some((role) => role.authorized_type === AccessEntityType.ADMIN)
  if (isAdmin) return ADMIN
  const isOpco = roles.some((role) => role.authorized_type === AccessEntityType.OPCO)
  if (isOpco) return OPCO
  const isCfa = roles.some((role) => role.authorized_type === AccessEntityType.CFA)
  if (isCfa) return CFA
  const isEntreprise = roles.some((role) => role.authorized_type === AccessEntityType.ENTREPRISE)
  if (isEntreprise) return ENTREPRISE
  return null
}

export const getUserTypeOrError = async (userId: string | ObjectId) => {
  const type = await getUserType(userId)
  if (!type) throw Boom.internal(`inattendu : aucun type trouvé pour user id=${userId}`)
  return type
}
