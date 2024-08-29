import { internal } from "@hapi/boom"
import { ObjectId } from "mongodb"
import { ADMIN, CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCO, OPCOS_LABEL } from "shared/constants/recruteur"
import { ComputedUserAccess, IUserRecruteurPublic } from "shared/models"
import { ICFA } from "shared/models/cfa.model"
import { IEntreprise } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { parseEnum, parseEnumOrError } from "shared/utils"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { getDbCollection } from "../common/utils/mongodbUtils"

import { getFormulaireFromUserIdOrError } from "./formulaire.service"

export const modifyPermissionToUser = async (
  props: Pick<IRoleManagement, "authorized_id" | "authorized_type" | "user_id" | "origin">,
  eventProps: Pick<IRoleManagementEvent, "reason" | "validation_type" | "granted_by" | "status">
): Promise<IRoleManagement> => {
  const now = new Date()
  const event: IRoleManagementEvent = {
    ...eventProps,
    date: now,
  }
  const { authorized_id, authorized_type, user_id } = props
  const role = await getDbCollection("rolemanagements").findOne({ authorized_id, authorized_type, user_id })

  if (role) {
    const lastEvent = getLastStatusEvent(role.status)
    if (lastEvent?.status === eventProps.status) {
      return role
    }
    const newRole = await getDbCollection("rolemanagements").findOneAndUpdate(
      { _id: role._id },
      { $push: { status: event }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    )
    if (!newRole) {
      throw internal("inattendu")
    }
    return newRole
  } else {
    const newRole: IRoleManagement = {
      ...props,
      _id: new ObjectId(),
      status: [event],
      updatedAt: now,
      createdAt: now,
    }
    await getDbCollection("rolemanagements").insertOne(newRole)
    return newRole
  }
}

export const getGrantedRoles = async (userId: string) => {
  const roles = await getDbCollection("rolemanagements")
    .find({ user_id: new ObjectId(userId) })
    .toArray()
  return roles.filter((role) => getLastStatusEvent(role.status)?.status === AccessStatus.GRANTED)
}

// TODO à supprimer lorsque les utilisateurs pourront avoir plusieurs types
export const getMainRoleManagement = async (userId: ObjectId, includeUserAwaitingValidation: boolean = false): Promise<IRoleManagement | null> => {
  const validStatus = [AccessStatus.GRANTED]
  if (includeUserAwaitingValidation) {
    validStatus.push(AccessStatus.AWAITING_VALIDATION)
  }
  const allRoles = await getDbCollection("rolemanagements").find({ user_id: userId }).toArray()
  const roles = allRoles.filter((role) => {
    const status = getLastStatusEvent(role.status)?.status
    return status ? validStatus.includes(status) : false
  })
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

export const roleToUserType = (role: IRoleManagement) => {
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

export const getPublicUserRecruteurPropsOrError = async (
  userId: ObjectId,
  includeUserAwaitingValidation: boolean = false
): Promise<Pick<IUserRecruteurPublic, "type" | "establishment_id" | "establishment_siret" | "scope" | "status_current">> => {
  const mainRole = await getMainRoleManagement(userId, includeUserAwaitingValidation)
  if (!mainRole) {
    throw internal(`inattendu : aucun role trouvé pour user id=${userId}`)
  }
  const type = roleToUserType(mainRole)
  if (!type) {
    throw internal(`inattendu : aucun type trouvé pour user id=${userId}`)
  }
  const status_current = roleToStatus(mainRole)
  if (!status_current) {
    throw internal(`inattendu : aucun status trouvé pour user id=${userId}`)
  }
  const commonFields = {
    type,
    status_current,
  } as const
  if (type === CFA) {
    const cfa = await getDbCollection("cfas").findOne({ _id: new ObjectId(mainRole.authorized_id) })
    if (!cfa) {
      throw internal(`inattendu : cfa non trouvé pour user id=${userId}`)
    }
    const { siret } = cfa
    return { ...commonFields, establishment_siret: siret }
  }
  if (type === ENTREPRISE) {
    const entreprise = await getDbCollection("entreprises").findOne({ _id: new ObjectId(mainRole.authorized_id.toString()) })
    if (!entreprise) {
      throw internal(`inattendu : entreprise non trouvée pour user id=${userId}`)
    }
    const { siret } = entreprise
    const user = await getDbCollection("userswithaccounts").findOne({ _id: userId })
    if (!user) {
      throw internal(`inattendu : user non trouvé`, { userId })
    }
    const recruiter = await getFormulaireFromUserIdOrError(user._id.toString())
    return { ...commonFields, establishment_siret: siret, establishment_id: recruiter.establishment_id }
  }
  if (type === OPCO) {
    return { ...commonFields, scope: parseEnumOrError(OPCOS_LABEL, mainRole.authorized_id) }
  }
  return commonFields
}

export const getComputedUserAccess = (userId: string, grantedRoles: IRoleManagement[]) => {
  // TODO
  // const indirectUserRoles = await RoleManagement.find({  })
  const userAccess: ComputedUserAccess = {
    admin: grantedRoles.some((role) => role.authorized_type === AccessEntityType.ADMIN),
    users: [userId],
    cfas: grantedRoles.flatMap((role) => (role.authorized_type === AccessEntityType.CFA ? [role.authorized_id] : [])),
    entreprises: grantedRoles.flatMap((role) => (role.authorized_type === AccessEntityType.ENTREPRISE ? [role.authorized_id] : [])),
    opcos: grantedRoles.flatMap((role) => {
      if (role.authorized_type === AccessEntityType.OPCO) {
        const opco = parseEnum(OPCOS_LABEL, role.authorized_id)
        if (opco) {
          return [opco]
        }
      }
      return []
    }),
  }
  return userAccess
}

export const getOrganizationFromRole = async (role: IRoleManagement): Promise<ICFA | IEntreprise | null> => {
  switch (role.authorized_type) {
    case AccessEntityType.CFA: {
      const cfaOpt = await getDbCollection("cfas").findOne({ _id: new ObjectId(role.authorized_id) })
      if (!cfaOpt) {
        throw new Error(`inattendu: impossible de trouver le cfa pour le role id=${role._id}`)
      }
      return cfaOpt
    }
    case AccessEntityType.ENTREPRISE: {
      const entrepriseOpt = await getDbCollection("entreprises").findOne({ _id: new ObjectId(role.authorized_id) })
      if (!entrepriseOpt) {
        throw new Error(`inattendu: impossible de trouver l'entreprise pour le role id=${role._id}`)
      }
      return entrepriseOpt
    }
    default:
      return null
  }
}
