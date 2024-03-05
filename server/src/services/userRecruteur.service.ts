import { randomUUID } from "crypto"

import Boom from "boom"
import { ObjectId } from "mongodb"
import type { FilterQuery, ModelUpdateOptions, UpdateQuery } from "mongoose"
import { IRecruiter, IUserRecruteur, IUserRecruteurWritable, IUserStatusValidation, UserRecruteurForAdminProjection, assertUnreachable } from "shared"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCOS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { ICFA } from "shared/models/cfa.model"
import { EntrepriseStatus, IEntreprise, IEntrepriseStatusEvent } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { IUser2, IUserStatusEvent, UserEventType } from "shared/models/user2.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"
import { entriesToTypedRecord, typedKeys } from "shared/utils/objectUtils"

import { parseEnumOrError } from "@/common/utils/enumUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { user2ToUserForToken } from "@/security/accessTokenService"

import { Cfa, Entreprise, RoleManagement, User2, UserRecruteur } from "../common/model/index"
import config from "../config"

import { createAuthMagicLink } from "./appLinks.service"
import { ADMIN, OPCO } from "./constant.service"
import mailer, { sanitizeForEmail } from "./mailer.service"
import { createOrganizationIfNotExist } from "./organization.service"
import { modifyPermissionToUser } from "./permissions.service"
import { createUser2IfNotExist } from "./user2.service"

/**
 * @description generate an API key
 * @returns {string}
 */
export const createApiKey = (): string => `mna-${randomUUID()}`

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

const getOrganismeFromRole = async (role: IRoleManagement): Promise<IEntreprise | ICFA | null> => {
  switch (role.authorized_type) {
    case AccessEntityType.ENTREPRISE: {
      const entreprise = await Entreprise.findOne({ _id: role.authorized_id }).lean()
      if (!entreprise) return null
      return entreprise
    }
    case AccessEntityType.CFA: {
      const cfa = await Cfa.findOne({ _id: role.authorized_id }).lean()
      if (!cfa) return null
      return cfa
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

export const getUserRecruteurById = (id: string | ObjectId) => getUserRecruteurByUser2Query({ _id: typeof id === "string" ? new ObjectId(id) : id })
export const getUserRecruteurByEmail = (email: string) => getUserRecruteurByUser2Query({ email })
export const getUserRecruteurByRecruiter = async (recruiter: IRecruiter): Promise<IUserRecruteur | null> => {
  const { cfa_delegated_siret, establishment_id } = recruiter
  if (cfa_delegated_siret) {
    const cfa = await Cfa.findOne({ siret: cfa_delegated_siret }).lean()
    if (!cfa) {
      throw new Error(`cfa with cfa_delegated_siret=${cfa_delegated_siret} not found`)
    }
    const role = await RoleManagement.findOne({ authorized_type: AccessEntityType.CFA, authorized_id: cfa._id.toString() }).lean()
    if (!role) {
      throw new Error(`role with authorized_id=${cfa._id} not found`)
    }
    return getUserRecruteurById(role.user_id)
  } else if (establishment_id) {
    const entreprise = await Entreprise.findOne({ establishment_id }).lean()
    if (!entreprise) {
      throw new Error(`entreprise with establishment_id=${establishment_id} not found`)
    }
    return getUserRecruteurById(entreprise._id)
  } else {
    throw new Error("inattendu: pas de establishment_id ni de cfa_delegated_siret")
  }
}

export const userAndRoleAndOrganizationToUserRecruteur = (user: IUser2, role: IRoleManagement, organisme: ICFA | IEntreprise): IUserRecruteur => {
  const { email, first_name, last_name, phone, last_action_date, _id } = user
  const organismeType = "status" in organisme ? ENTREPRISE : CFA
  const lastEntrepriseEvent = "status" in organisme ? getLastStatusEvent(organisme.status) : null
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
    ...(lastEntrepriseEvent?.status === EntrepriseStatus.ERROR ? [entrepriseStatusEventToUserRecruteurStatusEvent(lastEntrepriseEvent, ETAT_UTILISATEUR.ERROR)] : []),
  ]
  const roleType = role.authorized_type === AccessEntityType.OPCO ? OPCO : role.authorized_type === AccessEntityType.ADMIN ? ADMIN : null
  const type = roleType ?? organismeType ?? null
  if (!type) throw Boom.internal("unexpected: no type found")
  const { siret, address, address_detail, geo_coordinates, origin, raison_sociale, enseigne } = organisme
  const entrepriseFields =
    "idcc" in organisme
      ? {
          idcc: organisme.idcc,
          opco: organisme.opco,
          establishment_id: organisme.establishment_id,
        }
      : {}
  const userRecruteur: IUserRecruteur = {
    ...entrepriseFields,
    establishment_siret: siret,
    establishment_enseigne: enseigne,
    establishment_raison_sociale: raison_sociale,
    address,
    address_detail,
    geo_coordinates,
    origin,
    is_qualiopi: type === CFA,
    createdAt: role?.createdAt ?? user.createdAt,
    updatedAt: role?.updatedAt ?? user.updatedAt,
    is_email_checked: isUserEmailChecked(user),
    type,
    _id,
    email,
    first_name,
    last_name,
    phone,
    last_connection: last_action_date,
    status: oldStatus,
  }
  return userRecruteur
}

const getUserRecruteurByUser2Query = async (user2query: Partial<IUser2>): Promise<IUserRecruteur | null> => {
  const user = await User2.findOne(user2query).lean()
  if (!user) return null
  const role = await RoleManagement.findOne({ user_id: user._id.toString() }).lean()
  if (!role) return null
  const organisme = await getOrganismeFromRole(role)
  if (!organisme) return null
  return userAndRoleAndOrganizationToUserRecruteur(user, role, organisme)
}

export const createOrganizationUser = async (
  userRecruteurProps: Omit<IUserRecruteur, "_id" | "createdAt" | "updatedAt" | "status" | "scope">,
  statusEvent?: Pick<IRoleManagementEvent, "reason" | "validation_type" | "granted_by" | "status">
): Promise<UserAndOrganization> => {
  const { type, origin, first_name, last_name, last_connection, email, is_email_checked, phone } = userRecruteurProps
  if (type === ENTREPRISE || type === CFA) {
    const user = await createUser2IfNotExist(
      {
        email,
        first_name,
        last_name,
        phone: phone ?? "",
        last_action_date: last_connection,
      },
      is_email_checked
    )
    const organization = await createOrganizationIfNotExist(userRecruteurProps)
    await modifyPermissionToUser(
      {
        user_id: user._id,
        authorized_id: organization._id.toString(),
        authorized_type: type === ENTREPRISE ? AccessEntityType.ENTREPRISE : AccessEntityType.CFA,
        origin: origin ?? "createUser",
      },
      statusEvent ?? {
        validation_type: VALIDATION_UTILISATEUR.AUTO,
        status: type === ENTREPRISE ? AccessStatus.AWAITING_VALIDATION : AccessStatus.GRANTED,
        reason: "",
      }
    )
    return { organization, user, type }
  } else {
    throw Boom.internal(`unsupported type ${type}`)
  }
}

export const createOpcoUser = async (userProps: Pick<IUser2, "email" | "first_name" | "last_name" | "phone">, opco: OPCOS) => {
  const user = await createUser2IfNotExist(
    {
      ...userProps,
      last_action_date: new Date(),
    },
    false
  )
  await modifyPermissionToUser(
    {
      user_id: user._id,
      authorized_id: opco,
      authorized_type: AccessEntityType.OPCO,
      origin: "",
    },
    {
      validation_type: VALIDATION_UTILISATEUR.AUTO,
      status: AccessStatus.GRANTED,
      reason: "",
    }
  )
  return user
}

export const createAdminUser = async (userProps: Pick<IUser2, "email" | "first_name" | "last_name" | "phone">) => {
  const user = await createUser2IfNotExist(
    {
      ...userProps,
      last_action_date: new Date(),
    },
    false
  )
  await modifyPermissionToUser(
    {
      user_id: user._id,
      authorized_id: "",
      authorized_type: AccessEntityType.ADMIN,
      origin: "",
    },
    {
      validation_type: VALIDATION_UTILISATEUR.AUTO,
      status: AccessStatus.GRANTED,
      reason: "",
    }
  )
  return user
}

/**
 * @description création d'un nouveau user recruteur. Le champ status peut être passé ou, s'il n'est pas passé, être sauvé ultérieurement
 */
export const createUser = async (
  userProps: Omit<IUserRecruteur, "_id" | "createdAt" | "updatedAt" | "status">,
  statusEvent?: Pick<IRoleManagementEvent, "reason" | "validation_type" | "granted_by" | "status">
): Promise<IUser2> => {
  const { first_name, last_name, email, phone, type, opco } = userProps
  const userFields = {
    first_name,
    last_name,
    email,
    phone: phone ?? "",
  }

  if (type === ENTREPRISE || type === CFA) {
    const { user } = await createOrganizationUser(userProps, statusEvent)
    return user
  } else if (type === ADMIN) {
    const user = await createAdminUser(userFields)
    return user
  } else if (type === OPCO) {
    const user = await createOpcoUser(userFields, parseEnumOrError(OPCOS, opco ?? null))
    return user
  } else {
    assertUnreachable(type)
  }
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

export const updateUser2Fields = (userId: ObjectId, fields: Partial<IUser2>) => {
  return User2.findOneAndUpdate({ _id: userId }, fields, { new: true })
}

export const validateUserEmail = async (userId: ObjectId) => {
  const event: IUserStatusEvent = {
    date: new Date(),
    status: UserEventType.VALIDATION_EMAIL,
    validation_type: VALIDATION_UTILISATEUR.MANUAL,
    granted_by: userId.toString(),
    reason: "user validated its email",
  }
  await User2.updateOne({ _id: userId }, { $push: { status: event } })
}

/**
 * @description delete user from collection
 * @param {IUserRecruteur["_id"]} id
 * @returns {Promise<void>}
 */
export const removeUser = async (id: IUserRecruteur["_id"] | string) => {
  const user = await getUserRecruteurById(id)
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
export const updateLastConnectionDate = async (email: IUserRecruteur["email"]): Promise<void> => {
  await User2.findOneAndUpdate({ email: email.toLowerCase() }, { last_action_date: new Date() }, { new: true }).lean()
}

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

export const setEntrepriseInError = async (entrepriseId: IEntreprise["_id"], reason: string) => {
  const entreprise = await Entreprise.findOne({ _id: entrepriseId })
  if (!entreprise) {
    throw Boom.internal(`could not find entreprise with id=${entrepriseId}`)
  }
  const event: IEntrepriseStatusEvent = {
    date: new Date(),
    reason,
    status: EntrepriseStatus.ERROR,
    validation_type: VALIDATION_UTILISATEUR.AUTO,
  }
  await Entreprise.updateOne(
    { _id: entrepriseId },
    {
      $push: {
        status: event,
      },
    }
  )
}

const setAccessOfUserOnOrganization = async ({ user, organization, type }: UserAndOrganization, status: AccessStatus) => {
  await modifyPermissionToUser(
    {
      user_id: user._id,
      authorized_id: organization._id.toString(),
      authorized_type: type === ENTREPRISE ? AccessEntityType.ENTREPRISE : AccessEntityType.CFA,
      origin: "",
    },
    {
      validation_type: VALIDATION_UTILISATEUR.AUTO,
      status,
      reason: "",
    }
  )
}

export const autoValidateUser = async (props: UserAndOrganization) => {
  await setAccessOfUserOnOrganization(props, AccessStatus.GRANTED)
}

export const setUserHasToBeManuallyValidated = async (props: UserAndOrganization) => {
  await setAccessOfUserOnOrganization(props, AccessStatus.AWAITING_VALIDATION)
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

export const sendWelcomeEmailToUserRecruteur = async (user: IUser2) => {
  const { email, first_name, last_name } = user
  const role = await RoleManagement.findOne({ authorized_type: { $in: [AccessEntityType.ENTREPRISE, AccessEntityType.CFA] } }).lean()
  if (!role) {
    throw Boom.internal(`inattendu : pas de role pour user id=${user._id}`)
  }
  const isCfa = role.authorized_type === AccessEntityType.CFA
  const organization = await (isCfa ? Cfa : Entreprise).findOne({ _id: role.authorized_id }).lean()
  if (!organization) {
    throw Boom.internal(`inattendu : pas d'organization pour user id=${user._id} et role id=${role._id}`)
  }
  const { raison_sociale: establishment_raison_sociale } = organization
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
      is_delegated: isCfa,
      url: createAuthMagicLink(user2ToUserForToken(user)),
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

export const isUserEmailChecked = (user: IUser2): boolean => user.status.some((event) => event.status === UserEventType.VALIDATION_EMAIL)

export type UserAndOrganization = { user: IUser2; organization: IEntreprise | ICFA; type: "ENTREPRISE" | "CFA" }
