import { randomUUID } from "crypto"

import Boom from "boom"
import { ObjectId } from "mongodb"
import { IRecruiter, IUserRecruteur, IUserRecruteurForAdmin, IUserStatusValidation, assertUnreachable, parseEnumOrError, removeUndefinedFields } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { ADMIN, CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCO, OPCOS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { ICFA } from "shared/models/cfa.model"
import { EntrepriseStatus, IEntreprise, IEntrepriseStatusEvent } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { ObjectIdType } from "@/common/mongodb"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"

import { Cfa, Entreprise, Recruiter, RoleManagement, UserWithAccount } from "../common/model/index"
import config from "../config"

import { createAuthMagicLink } from "./appLinks.service"
import { getFormulaireFromUserIdOrError } from "./formulaire.service"
import mailer, { sanitizeForEmail } from "./mailer.service"
import { createOrganizationIfNotExist } from "./organization.service"
import { modifyPermissionToUser } from "./roleManagement.service"
import { createUser2IfNotExist, isUserEmailChecked } from "./userWithAccount.service"

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
      if (!entreprise) {
        throw Boom.internal(`could not find entreprise for role ${role._id}`)
      }
      return entreprise
    }
    case AccessEntityType.CFA: {
      const cfa = await Cfa.findOne({ _id: role.authorized_id }).lean()
      if (!cfa) {
        throw Boom.internal(`could not find cfa for role ${role._id}`)
      }
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

export const getUserRecruteurById = (id: string | ObjectIdType) => getUserRecruteurByUser2Query({ _id: typeof id === "string" ? new ObjectId(id) : id })

export const userAndRoleAndOrganizationToUserRecruteur = (
  user: IUserWithAccount,
  role: IRoleManagement,
  organisme: ICFA | IEntreprise | null,
  formulaire: IRecruiter | null
): IUserRecruteur => {
  const { email, first_name, last_name, phone, last_action_date, _id } = user
  const organismeType = organisme ? ("status" in organisme ? ENTREPRISE : CFA) : null
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
  ]
  if (organisme && "status" in organisme) {
    const lastStatusEvent = getLastStatusEvent(organisme.status)
    if (lastStatusEvent?.status === EntrepriseStatus.ERROR) {
      oldStatus.push(entrepriseStatusEventToUserRecruteurStatusEvent(lastStatusEvent, ETAT_UTILISATEUR.ERROR))
    }
  }

  const roleType = role.authorized_type === AccessEntityType.OPCO ? OPCO : role.authorized_type === AccessEntityType.ADMIN ? ADMIN : null
  const type = roleType ?? organismeType ?? null
  if (!type) throw Boom.internal("unexpected: no type found")
  const { siret, address, address_detail, geo_coordinates, origin, raison_sociale, enseigne } = organisme ?? {}
  let entrepriseFields = {}
  if (organisme && "opco" in organisme) {
    const { idcc, opco } = organisme
    entrepriseFields = { idcc, opco }
  }
  if (formulaire) {
    const { establishment_id } = formulaire
    Object.assign(entrepriseFields, { establishment_id })
  }
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

const getUserRecruteurByUser2Query = async (user2query: Partial<IUserWithAccount>): Promise<IUserRecruteur | null> => {
  const user = await UserWithAccount.findOne(user2query).lean()
  if (!user) return null
  const role = await RoleManagement.findOne({ user_id: user._id.toString() }).lean()
  if (!role) return null
  const organisme = await getOrganismeFromRole(role)
  if (!organisme) return null
  const formulaire = role.authorized_type === AccessEntityType.ENTREPRISE ? await getFormulaireFromUserIdOrError(user._id.toString()) : null
  return userAndRoleAndOrganizationToUserRecruteur(user, role, organisme, formulaire)
}

/**
 * Crée l'utilisateur si il n'existe pas
 * Crée l'organisation si elle n'existe pas
 * Si statusEvent est passé, ajoute les droits de l'utilisateur sur l'organisation.
 * Sinon, c'est de la responsabilité de l'appelant d'ajouter le status des droits ultérieurement.
 */
export const createOrganizationUser = async (
  userRecruteurProps: Omit<IUserRecruteur, "_id" | "createdAt" | "updatedAt" | "status" | "scope">,
  grantedBy?: string,
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
      is_email_checked,
      grantedBy ?? ""
    )
    const organization = await createOrganizationIfNotExist(userRecruteurProps)
    await modifyPermissionToUser(
      {
        user_id: user._id,
        authorized_id: organization._id.toString(),
        authorized_type: type === ENTREPRISE ? AccessEntityType.ENTREPRISE : AccessEntityType.CFA,
        origin: origin ?? "création de compte",
      },
      statusEvent ?? {
        reason: "création de compte",
        status: AccessStatus.AWAITING_VALIDATION,
        validation_type: VALIDATION_UTILISATEUR.AUTO,
      }
    )
    return { organization, user, type }
  } else {
    throw Boom.internal(`unsupported type ${type}`)
  }
}

export const createOpcoUser = async (userProps: Pick<IUserWithAccount, "email" | "first_name" | "last_name" | "phone">, opco: OPCOS, grantedBy: string) => {
  const user = await createUser2IfNotExist(
    {
      ...userProps,
      last_action_date: new Date(),
    },
    false,
    grantedBy
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

export const createAdminUser = async (
  userProps: Pick<IUserWithAccount, "email" | "first_name" | "last_name" | "phone">,
  { grantedBy, origin = "", reason = "" }: { reason?: string; origin?: string; grantedBy: string }
) => {
  const user = await createUser2IfNotExist(
    {
      ...userProps,
      last_action_date: new Date(),
    },
    false,
    grantedBy
  )
  await modifyPermissionToUser(
    {
      user_id: user._id,
      authorized_id: "",
      authorized_type: AccessEntityType.ADMIN,
      origin,
    },
    {
      validation_type: VALIDATION_UTILISATEUR.AUTO,
      status: AccessStatus.GRANTED,
      reason,
    }
  )
  return user
}

/**
 * @description création d'un nouveau user recruteur. Le champ status peut être passé ou, s'il n'est pas passé, être sauvé ultérieurement
 */
export const createUser = async (
  userProps: Omit<IUserRecruteur, "_id" | "createdAt" | "updatedAt" | "status">,
  grantedBy: string,
  statusEvent?: Pick<IRoleManagementEvent, "reason" | "validation_type" | "granted_by" | "status">
): Promise<IUserWithAccount> => {
  const { first_name, last_name, email, phone, type, opco } = userProps
  const userFields = {
    first_name,
    last_name,
    email,
    phone: phone ?? "",
  }

  if (type === ENTREPRISE || type === CFA) {
    const { user } = await createOrganizationUser(userProps, grantedBy, statusEvent)
    return user
  } else if (type === ADMIN) {
    const user = await createAdminUser(userFields, { grantedBy })
    return user
  } else if (type === OPCO) {
    const user = await createOpcoUser(userFields, parseEnumOrError(OPCOS, opco ?? null), grantedBy)
    return user
  } else {
    assertUnreachable(type)
  }
}

export const updateUserWithAccountFields = async (userId: ObjectId, fields: Partial<IUserWithAccount>): Promise<IUserWithAccount | { error: BusinessErrorCodes }> => {
  const { email, first_name, last_name, phone } = fields
  const newEmail = email?.toLocaleLowerCase()

  if (newEmail) {
    const exist = await UserWithAccount.findOne({ email: newEmail, _id: { $ne: userId } }).lean()
    if (exist) {
      return { error: BusinessErrorCodes.EMAIL_ALREADY_EXISTS }
    }
  }
  const newUser = await UserWithAccount.findOneAndUpdate({ _id: userId }, removeUndefinedFields({ ...fields, email: newEmail }), { new: true }).lean()
  if (!newUser) {
    throw Boom.badRequest("user not found")
  }
  await Recruiter.updateMany({ "jobs.managed_by": userId.toString() }, { $set: removeUndefinedFields({ first_name, last_name, phone, email: newEmail }) })
  return newUser
}

export const removeUser = async (id: IUserWithAccount["_id"] | string) => {
  await RoleManagement.deleteMany({ user_id: id })
}

/**
 * @description update last_connection user date
 * @param {IUserRecruteur["email"]} email
 * @returns {Promise<IUserRecruteur>}
 */
export const updateLastConnectionDate = async (email: IUserRecruteur["email"]): Promise<void> => {
  await UserWithAccount.findOneAndUpdate({ email: email.toLowerCase() }, { last_action_date: new Date() }, { new: true }).lean()
}

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

export const setEntrepriseValid = async (entrepriseId: IEntreprise["_id"]) => {
  return setEntrepriseStatus(entrepriseId, "", EntrepriseStatus.VALIDE)
}

export const setEntrepriseInError = async (entrepriseId: IEntreprise["_id"], reason: string) => {
  return setEntrepriseStatus(entrepriseId, reason, EntrepriseStatus.ERROR)
}

export const setEntrepriseStatus = async (entrepriseId: IEntreprise["_id"], reason: string, status: EntrepriseStatus) => {
  const entreprise = await Entreprise.findOne({ _id: entrepriseId })
  if (!entreprise) {
    throw Boom.internal(`could not find entreprise with id=${entrepriseId}`)
  }
  const lastStatus = getLastStatusEvent(entreprise.status)?.status
  if (lastStatus === status && status === EntrepriseStatus.VALIDE) return
  const event: IEntrepriseStatusEvent = {
    date: new Date(),
    reason,
    status,
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

const setAccessOfUserOnOrganization = async ({ user, organization, type }: UserAndOrganization, status: AccessStatus, origin: string, reason: string) => {
  await modifyPermissionToUser(
    {
      user_id: user._id,
      authorized_id: organization._id.toString(),
      authorized_type: type === ENTREPRISE ? AccessEntityType.ENTREPRISE : AccessEntityType.CFA,
      origin,
    },
    {
      validation_type: VALIDATION_UTILISATEUR.AUTO,
      status,
      reason,
    }
  )
}

export const autoValidateUser = async (props: UserAndOrganization, origin: string, reason: string) => {
  await setAccessOfUserOnOrganization(props, AccessStatus.GRANTED, origin, reason)
}

export const setUserHasToBeManuallyValidated = async (props: UserAndOrganization, origin: string, reason = "pas de validation automatique possible") => {
  await setAccessOfUserOnOrganization(props, AccessStatus.AWAITING_VALIDATION, origin, reason)
}

export const deactivateEntreprise = async (entrepriseId: IEntreprise["_id"], reason: string) => {
  return setEntrepriseStatus(entrepriseId, reason, EntrepriseStatus.DESACTIVE)
}

export const sendWelcomeEmailToUserRecruteur = async (user: IUserWithAccount) => {
  const { email, first_name, last_name } = user
  const role = await RoleManagement.findOne({ user_id: user._id, authorized_type: { $in: [AccessEntityType.ENTREPRISE, AccessEntityType.CFA] } }).lean()
  if (!role) {
    throw Boom.internal(`inattendu : pas de role pour user id=${user._id}`)
  }
  const isCfa = role.authorized_type === AccessEntityType.CFA
  let organization
  if (isCfa) {
    organization = await Cfa.findOne({ _id: role.authorized_id }).lean()
  } else {
    organization = await Entreprise.findOne({ _id: role.authorized_id }).lean()
  }
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
      url: createAuthMagicLink(userWithAccountToUserForToken(user)),
    },
  })
}

export const getAdminUsers = async () => {
  const allRoles = await RoleManagement.find({
    authorized_type: AccessEntityType.ADMIN,
  }).lean()
  const grantedRoles = allRoles.filter((role) => getLastStatusEvent(role.status)?.status === AccessStatus.GRANTED)
  const userIds = grantedRoles.map((role) => role.user_id.toString())
  const users = await UserWithAccount.find({ _id: { $in: userIds } }).lean()
  return users
}

export const getUserRecruteursForManagement = async ({ opco, activeRoleLimit }: { opco?: OPCOS; activeRoleLimit?: number }) => {
  const nonGrantedRoles = await RoleManagement.find({ $expr: { $ne: [{ $arrayElemAt: ["$status.status", -1] }, AccessStatus.GRANTED] } }).lean()
  const lastGrantedRoles = await RoleManagement.find({ $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, AccessStatus.GRANTED] } })
    .sort({ updatedAt: -1 })
    .limit(activeRoleLimit ?? 1000)
    .lean()
  const roles = [...nonGrantedRoles, ...lastGrantedRoles]

  const userIds = roles.map((role) => role.user_id.toString())
  const users = await UserWithAccount.find({ _id: { $in: userIds } }).lean()

  const entrepriseIds = roles.flatMap((role) => (role.authorized_type === AccessEntityType.ENTREPRISE ? [role.authorized_id] : []))
  const entreprises = await Entreprise.find({ _id: { $in: entrepriseIds }, ...(opco ? { opco } : {}) }).lean()

  const cfaIds = opco ? [] : roles.flatMap((role) => (role.authorized_type === AccessEntityType.CFA ? [role.authorized_id] : []))
  const cfas = cfaIds.length ? await Cfa.find({ _id: { $in: cfaIds } }).lean() : []

  const userRecruteurs = roles
    .flatMap<{ user: IUserWithAccount; role: IRoleManagement } & ({ entreprise: IEntreprise } | { cfa: ICFA })>((role) => {
      const user = users.find((user) => user._id.toString() === role.user_id.toString())
      if (!user) return []
      const { authorized_type } = role
      if (authorized_type === AccessEntityType.ENTREPRISE) {
        const entreprise = entreprises.find((entreprise) => entreprise._id.toString() === role.authorized_id)
        if (!entreprise) return []
        return [{ user, role, entreprise, type: ENTREPRISE }]
      } else if (authorized_type === AccessEntityType.CFA) {
        const cfa = cfas.find((cfa) => cfa._id.toString() === role.authorized_id)
        if (!cfa) return []
        return [{ user, role, cfa, type: CFA }]
      } else {
        return []
      }
    })
    .map((result) => {
      const { user, role } = result
      const organization = "entreprise" in result ? result.entreprise : result.cfa
      const userRecruteur = userAndRoleAndOrganizationToUserRecruteur(user, role, organization, null)
      const { _id, establishment_raison_sociale, establishment_siret, type, first_name, last_name, email, phone, createdAt, origin, opco, status } = userRecruteur
      const userRecruteurForAdmin: IUserRecruteurForAdmin = {
        _id,
        establishment_raison_sociale,
        establishment_siret,
        type,
        first_name,
        last_name,
        email,
        phone,
        createdAt,
        origin,
        opco,
        status,
        organizationId: organization._id,
      }
      return userRecruteurForAdmin
    })
  return userRecruteurs.reduce(
    (acc, userRecruteur) => {
      const lastStatus = getLastStatusEvent(userRecruteur.status)?.status
      switch (lastStatus) {
        case ETAT_UTILISATEUR.DESACTIVE: {
          acc.disabled.push(userRecruteur)
          return acc
        }
        case ETAT_UTILISATEUR.ATTENTE: {
          acc.awaiting.push(userRecruteur)
          return acc
        }
        case ETAT_UTILISATEUR.ERROR: {
          acc.error.push(userRecruteur)
          return acc
        }
        case ETAT_UTILISATEUR.VALIDE: {
          acc.active.push(userRecruteur)
          return acc
        }
        default:
          return acc
      }
    },
    {
      awaiting: [] as IUserRecruteurForAdmin[],
      active: [] as IUserRecruteurForAdmin[],
      disabled: [] as IUserRecruteurForAdmin[],
      error: [] as IUserRecruteurForAdmin[],
    }
  )
}

export const getUsersForAdmin = async () => {
  return getUserRecruteursForManagement({ activeRoleLimit: 40 })
}

export type UserAndOrganization = { user: IUserWithAccount; organization: IEntreprise | ICFA; type: "ENTREPRISE" | "CFA" }
