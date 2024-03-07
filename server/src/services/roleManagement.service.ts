import Boom from "boom"
import type { ObjectId } from "mongodb"
import { ETAT_UTILISATEUR, OPCOS } from "shared/constants/recruteur"
import { IUserRecruteurPublic } from "shared/models"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { Cfa, Entreprise, RoleManagement, User2 } from "@/common/model"
import { parseEnumOrError } from "@/common/utils/enumUtils"

import { ADMIN, CFA, ENTREPRISE, OPCO } from "./constant.service"
import { getFormulaireFromUserId } from "./formulaire.service"

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
    const role = (await RoleManagement.create(newRole)).toObject()
    return role
  }
}

const getGrantedRoles = async (userId: string) => {
  return RoleManagement.find({ user_id: userId, $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, AccessStatus.GRANTED] } }).lean()
}

// TODO à supprimer lorsque les utilisateurs pourront avoir plusieurs types
export const getMainRoleManagement = async (userId: string | ObjectId): Promise<IRoleManagement | null> => {
  const roles = await getGrantedRoles(userId.toString())
  const adminRole = roles.find((role) => role.authorized_type === AccessEntityType.ADMIN)
  if (adminRole) return adminRole
  const opcoRole = roles.find((role) => role.authorized_type === AccessEntityType.OPCO)
  if (opcoRole) return opcoRole
  const cfaRole = roles.find((role) => role.authorized_type === AccessEntityType.CFA)
  if (cfaRole) return cfaRole
  const entrepriseRole = roles.find((role) => role.authorized_type === AccessEntityType.ENTREPRISE)
  if (entrepriseRole) return entrepriseRole
  return null
}

const roleToUserType = (role: IRoleManagement) => {
  switch (role.authorized_type) {
    case AccessEntityType.ADMIN:
      return ADMIN
    case AccessEntityType.CFA:
      return CFA
    case AccessEntityType.ENTREPRISE:
      return ENTREPRISE
    case AccessEntityType.OPCO:
      return OPCO
    default:
      return null
  }
}

const roleToStatus = (role: IRoleManagement) => {
  const lastStatus = getLastStatusEvent(role.status)?.status
  switch (lastStatus) {
    case AccessStatus.GRANTED:
      return ETAT_UTILISATEUR.VALIDE
    case AccessStatus.DENIED:
      return ETAT_UTILISATEUR.DESACTIVE
    case AccessStatus.AWAITING_VALIDATION:
      return ETAT_UTILISATEUR.ATTENTE
    default:
      return null
  }
}

export const getUserRecruteurPropsOrError = async (
  userId: string | ObjectId
): Promise<Pick<IUserRecruteurPublic, "type" | "establishment_id" | "establishment_siret" | "scope" | "status_current">> => {
  const mainRole = await getMainRoleManagement(userId)
  if (!mainRole) {
    throw Boom.internal(`inattendu : aucun role trouvé pour user id=${userId}`)
  }
  const type = roleToUserType(mainRole)
  if (!type) {
    throw Boom.internal(`inattendu : aucun type trouvé pour user id=${userId}`)
  }
  const status_current = roleToStatus(mainRole)
  if (!status_current) {
    throw Boom.internal(`inattendu : aucun status trouvé pour user id=${userId}`)
  }
  const commonFields = {
    type,
    status_current,
  } as const
  if (type === CFA) {
    const cfa = await Cfa.findOne({ _id: mainRole.authorized_id }).lean()
    if (!cfa) {
      throw Boom.internal(`inattendu : cfa non trouvé pour user id=${userId}`)
    }
    const { siret } = cfa
    return { ...commonFields, establishment_siret: siret }
  }
  if (type === ENTREPRISE) {
    const entreprise = await Entreprise.findOne({ _id: mainRole.authorized_id }).lean()
    if (!entreprise) {
      throw Boom.internal(`inattendu : entreprise non trouvée pour user id=${userId}`)
    }
    const { siret } = entreprise
    const user = await User2.findOne({ _id: userId }).lean()
    if (!user) {
      throw Boom.internal(`inattendu : user non trouvé`, { userId })
    }
    const recruiter = await getFormulaireFromUserId(user._id.toString())
    return { ...commonFields, establishment_siret: siret, establishment_id: recruiter.establishment_id }
  }
  if (type === OPCO) {
    return { ...commonFields, scope: parseEnumOrError(OPCOS, mainRole.authorized_id) }
  }
  return commonFields
}
