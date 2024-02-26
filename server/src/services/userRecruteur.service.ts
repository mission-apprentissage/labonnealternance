import { randomUUID } from "crypto"

import Boom from "boom"
import type { FilterQuery, ModelUpdateOptions, ObjectId, UpdateQuery } from "mongoose"
import { IUserRecruteur, IUserRecruteurWritable, IUserStatusValidation, UserRecruteurForAdminProjection, assertUnreachable } from "shared"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { EntrepriseStatus, IEntrepriseStatusEvent } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus, IRoleManagement } from "shared/models/roleManagement.model"
import { UserEventType } from "shared/models/user2.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"
import { entriesToTypedRecord, typedKeys } from "shared/utils/objectUtils"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { Cfa, Entreprise, RoleManagement, User2, UserRecruteur } from "../common/model/index"
import config from "../config"

import { createAuthMagicLink } from "./appLinks.service"
import { ADMIN } from "./constant.service"
import mailer, { sanitizeForEmail } from "./mailer.service"

/**
 * @description generate an API key
 * @returns {string}
 */
export const createApiKey = (): string => `mna-${randomUUID()}`

/**
 * @description get a single user using a given query filter
 */
export const getUser = async (query: FilterQuery<IUserRecruteur>): Promise<IUserRecruteur | null> => {
  return UserRecruteur.findOne(query).lean()
}

const entrepriseStatusEventToUserRecruteurStatusEvent = (entrepriseStatusEvent: IEntrepriseStatusEvent, forcedStatus: ETAT_UTILISATEUR): IUserStatusValidation => {
  const { date, reason, validation_type, granted_by } = entrepriseStatusEvent
  return {
    date,
    user: granted_by ?? "",
    validation_type,
    reason,
    status: forcedStatus,
  }
}

const getOrganismeFromRole = async (role: IRoleManagement): Promise<Partial<IUserRecruteur> | null> => {
  switch (role.authorized_type) {
    case AccessEntityType.ENTREPRISE: {
      const entreprise = await Entreprise.findOne({ _id: role.authorized_id }).lean()
      if (!entreprise) return null
      const { siret, address, address_detail, establishment_id, geo_coordinates, idcc, opco, origin, raison_sociale, enseigne, status } = entreprise
      const lastStatus = getLastStatusEvent(status)

      return {
        establishment_siret: siret,
        establishment_enseigne: enseigne,
        establishment_raison_sociale: raison_sociale,
        address,
        address_detail,
        establishment_id,
        geo_coordinates,
        idcc,
        opco,
        origin,
        type: ENTREPRISE,
        status: lastStatus?.status === EntrepriseStatus.ERROR ? [entrepriseStatusEventToUserRecruteurStatusEvent(lastStatus, ETAT_UTILISATEUR.ERROR)] : [],
      }
    }
    case AccessEntityType.CFA: {
      const cfa = await Cfa.findOne({ _id: role.authorized_id }).lean()
      if (!cfa) return null
      const { siret, address, address_detail, geo_coordinates, origin, raison_sociale, enseigne } = cfa
      return {
        establishment_siret: siret,
        establishment_enseigne: enseigne,
        establishment_raison_sociale: raison_sociale,
        address,
        address_detail,
        geo_coordinates,
        origin,
        type: CFA,
        is_qualiopi: true,
      }
    }
    default:
      return null
  }
}

const roleStatusToUserRecruteurStatus = (roleStatus: AccessStatus): ETAT_UTILISATEUR => {
  switch (roleStatus) {
    case AccessStatus.GRANTED:
      return ETAT_UTILISATEUR.VALIDE
    case AccessStatus.DENIED:
      return ETAT_UTILISATEUR.DESACTIVE
    case AccessStatus.AWAITING_VALIDATION:
      return ETAT_UTILISATEUR.ATTENTE
    default:
      assertUnreachable(roleStatus)
  }
}

export const getUserRecruteurById = async (id: ObjectId): Promise<IUserRecruteur | null> => {
  const user = await User2.findById(id).lean()
  if (!user) return null
  const role = await RoleManagement.findOne({ user_id: id.toString() }).lean()
  if (!role) return null
  const organismeData = await getOrganismeFromRole(role)
  const { email, first_name, last_name, phone, last_action_date, _id } = user
  const oldStatus: IUserStatusValidation[] = [
    ...role.status.map(({ date, reason, status, validation_type, granted_by }) => {
      const userRecruteurStatus = roleStatusToUserRecruteurStatus(status)
      return {
        date,
        reason,
        status: userRecruteurStatus,
        validation_type,
        user: granted_by ?? "",
      }
    }),
    ...(organismeData?.status ?? []),
  ]
  const roleType = role.authorized_type === AccessEntityType.OPCO ? "OPCO" : role.authorized_type === AccessEntityType.ADMIN ? "ADMIN" : null
  const organismeType = organismeData?.type
  const type = roleType ?? organismeType ?? null
  if (!type) throw Boom.internal("unexpected: no type found")
  return {
    ...organismeData,
    createdAt: organismeData?.createdAt ?? user.createdAt,
    updatedAt: organismeData?.updatedAt ?? user.updatedAt,
    is_email_checked: user.status.some((event) => event.status === UserEventType.VALIDATION_EMAIL),
    type,
    _id,
    email,
    first_name,
    last_name,
    phone,
    last_connection: last_action_date,
    status: oldStatus,
  }
}

/**
 * @description création d'un nouveau user recruteur. Le champ status peut être passé ou, s'il n'est pas passé, être sauvé ultérieurement
 */
export const createUser = async (
  userRecruteurProps: Omit<IUserRecruteur, "_id" | "createdAt" | "updatedAt" | "status"> & Partial<Pick<IUserRecruteur, "status">>
): Promise<IUserRecruteur> => {
  let scope = userRecruteurProps.scope ?? undefined

  const formatedEmail = userRecruteurProps.email.toLocaleLowerCase()

  if (!scope) {
    if (userRecruteurProps.type === "CFA") {
      // generate user scope
      const [key] = randomUUID().split("-")
      scope = `cfa-${key}`
    } else {
      let key
      if (userRecruteurProps?.establishment_raison_sociale) {
        key = userRecruteurProps.establishment_raison_sociale.toLowerCase().replace(/ /g, "-")
      } else {
        key = randomUUID().split("-")[0]
      }
      scope = `etp-${key}`
    }
  }
  const createdUser = await UserRecruteur.create({
    status: [],
    ...userRecruteurProps,
    scope,
    email: formatedEmail,
  })
  return createdUser.toObject()
}

/**
 * @description update user
 * @param {Filter<IUserRecruteur>} query
 * @param {UpdateQuery<IUserRecruteur>} update
 * @param {ModelUpdateOptions} options
 * @returns {Promise<IUserRecruteur>}
 */
export const updateUser = async (
  query: FilterQuery<IUserRecruteur>,
  update: Partial<IUserRecruteurWritable>,
  options: ModelUpdateOptions = { new: true }
): Promise<IUserRecruteur> => {
  const userRecruterOpt = await UserRecruteur.findOneAndUpdate(query, update, options).lean()
  if (!userRecruterOpt) {
    throw Boom.internal(`could not update one user from query=${JSON.stringify(query)}`)
  }
  return userRecruterOpt
}

/**
 * @description delete user from collection
 * @param {IUserRecruteur["_id"]} id
 * @returns {Promise<void>}
 */
export const removeUser = async (id: IUserRecruteur["_id"] | string) => {
  const user = await UserRecruteur.findById(id)
  if (!user) {
    throw new Error(`Unable to find user ${id}`)
  }

  return await UserRecruteur.deleteOne({ _id: id })
}

/**
 * @description update last_connection user date
 * @param {IUserRecruteur["email"]} email
 * @returns {Promise<IUserRecruteur>}
 */
export const updateLastConnectionDate = (email: IUserRecruteur["email"]) =>
  UserRecruteur.findOneAndUpdate({ email: email.toLowerCase() }, { last_connection: new Date() }, { new: true }).lean()

/**
 * @description update user validation status
 * @param {IUserRecruteur["_id"]} userId
 * @param {UpdateQuery<IUserRecruteur["status"]} state
 * @param {ModelUpdateOptions} [options={new:true}]
 * @returns {Promise<IUserRecruteur>}
 */
export const updateUserValidationHistory = async (
  userId: IUserRecruteur["_id"],
  state: UpdateQuery<IUserStatusValidation>,
  options: ModelUpdateOptions = { new: true }
): Promise<IUserRecruteur | null> => await UserRecruteur.findByIdAndUpdate({ _id: userId }, { $push: { status: state } }, options).lean()

/**
 * @description get last user validation state from status array, by creation date
 * @param {IUserRecruteur["status"]} stateArray
 * @returns {IUserRecruteur["status"]}
 */
export const getUserStatus = (stateArray: IUserRecruteur["status"]): IUserStatusValidation["status"] => {
  const sortedArray = [...stateArray].sort((a, b) => new Date(a?.date ?? 0).valueOf() - new Date(b?.date ?? 0).valueOf())
  const lastValidationEvent = sortedArray.at(-1)
  if (!lastValidationEvent) {
    throw Boom.internal("no status found in status array")
  }
  return lastValidationEvent.status
}

export const setUserInError = async (userId: IUserRecruteur["_id"], reason: string) => {
  const response = await updateUserValidationHistory(userId, {
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    user: "SERVEUR",
    status: ETAT_UTILISATEUR.ERROR,
    reason,
  })
  if (!response) {
    throw new Error(`could not find user history for user with id=${userId}`)
  }
  return response
}

export const autoValidateUser = async (userId: IUserRecruteur["_id"]) => {
  const response = await updateUserValidationHistory(userId, {
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    user: "SERVEUR",
    status: ETAT_UTILISATEUR.VALIDE,
  })
  if (!response) {
    throw new Error(`could not find user history for user with id=${userId}`)
  }
  return response
}

export const setUserHasToBeManuallyValidated = async (userId: IUserRecruteur["_id"]) => {
  const response = await updateUserValidationHistory(userId, {
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    user: "SERVEUR",
    status: ETAT_UTILISATEUR.ATTENTE,
  })
  if (!response) {
    throw new Error(`could not find user history for user with id=${userId}`)
  }
  return response
}

export const deactivateUser = async (userId: IUserRecruteur["_id"], reason?: string) => {
  const response = await updateUserValidationHistory(userId, {
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    user: "SERVEUR",
    status: ETAT_UTILISATEUR.DESACTIVE,
    reason,
  })
  if (!response) {
    throw new Error(`could not find user history for user with id=${userId}`)
  }
  return response
}

export const sendWelcomeEmailToUserRecruteur = async (userRecruteur: IUserRecruteur) => {
  const { email, first_name, last_name, establishment_raison_sociale, type } = userRecruteur
  await mailer.sendEmail({
    to: email,
    subject: "Bienvenue sur La bonne alternance",
    template: getStaticFilePath("./templates/mail-bienvenue.mjml.ejs"),
    data: {
      images: {
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
      },
      establishment_raison_sociale: establishment_raison_sociale,
      last_name: sanitizeForEmail(last_name),
      first_name: sanitizeForEmail(first_name),
      email: sanitizeForEmail(email),
      is_delegated: type === CFA,
      url: createAuthMagicLink(userRecruteur),
    },
  })
}

const projection = entriesToTypedRecord(typedKeys(UserRecruteurForAdminProjection).map((key) => [key, 1 as const]))

export const getAdminUsers = () => UserRecruteur.find({ type: ADMIN }).lean()

export const getActiveUsers = () =>
  UserRecruteur.find({
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.VALIDE] },
    $or: [{ type: CFA }, { type: ENTREPRISE }],
  })
    .select(projection)
    .lean()

export const getAwaitingUsers = () =>
  UserRecruteur.find({
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.ATTENTE] },
    $or: [{ type: CFA }, { type: ENTREPRISE }],
  })
    .select(projection)
    .lean()

export const getDisabledUsers = () =>
  UserRecruteur.find({
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.DESACTIVE] },
    $or: [{ type: CFA }, { type: ENTREPRISE }],
  })
    .select(projection)
    .lean()

export const getErrorUsers = () =>
  UserRecruteur.find({
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.ERROR] },
    $or: [{ type: CFA }, { type: ENTREPRISE }],
  })
    .select(projection)
    .lean()

export const getUsersWithRoles = async () => {
  const usersWithRoles = await RoleManagement.aggregate([
    {
      $lookup: {
        from: "user2",
        localField: "user_id",
        foreignField: "_id",
        as: "roles",
      },
    },
  ])
  console.log(usersWithRoles.slice(0, 3))
  return usersWithRoles
}
