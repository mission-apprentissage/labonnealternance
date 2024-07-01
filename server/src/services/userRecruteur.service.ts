import Boom from "boom"
import { ObjectId } from "mongodb"
import { IRecruiter, IUserRecruteur, IUserRecruteurForAdmin, IUserStatusValidation, assertUnreachable, removeUndefinedFields } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { ADMIN, CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCO, OPCOS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { ICFA } from "shared/models/cfa.model"
import { EntrepriseStatus, IEntreprise, IEntrepriseStatusEvent } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { IUserWithAccount, IUserWithAccountFields } from "shared/models/userWithAccount.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"

import { getDbCollection } from "../common/utils/mongodbUtils"
import config from "../config"

import { createAuthMagicLink } from "./appLinks.service"
import { getFormulaireFromUserIdOrError } from "./formulaire.service"
import mailer, { sanitizeForEmail } from "./mailer.service"
import { Organization, UserAndOrganization } from "./organization.service"
import { getOrganizationFromRole, modifyPermissionToUser } from "./roleManagement.service"
import { createUser2IfNotExist, isUserEmailChecked } from "./userWithAccount.service"

const entrepriseStatusEventToUserRecruteurStatusEvent = (entrepriseStatusEvent: IEntrepriseStatusEvent, forcedStatus: ETAT_UTILISATEUR): IUserStatusValidation => {
  const { reason, validation_type, granted_by } = entrepriseStatusEvent
  return {
    date: new Date(),
    user: granted_by ?? "",
    validation_type,
    reason,
    status: forcedStatus,
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
  const user = await getDbCollection("userswithaccounts").findOne(user2query)
  if (!user) return null
  const role = await getDbCollection("rolemanagements").findOne({ user_id: user._id })
  if (!role) return null
  const organization = await getOrganizationFromRole(role)
  if (!organization) return null
  const formulaire = role.authorized_type === AccessEntityType.ENTREPRISE ? await getFormulaireFromUserIdOrError(user._id.toString()) : null
  return userAndRoleAndOrganizationToUserRecruteur(user, role, organization, formulaire)
}

/**
 * Crée l'utilisateur si il n'existe pas
 * Si statusEvent est passé, ajoute les droits de l'utilisateur sur l'organisation.
 * Sinon, les droits sont mis en attente de validation
 */
export const createOrganizationUser = async ({
  userFields,
  is_email_checked,
  organization,
  grantedBy,
  statusEvent,
}: {
  userFields: Omit<IUserWithAccount, "_id" | "createdAt" | "updatedAt" | "status">
  is_email_checked: boolean
  organization: Organization
  grantedBy?: string
  statusEvent?: Pick<IRoleManagementEvent, "reason" | "validation_type" | "granted_by" | "status">
}): Promise<IUserWithAccount> => {
  const user = await createUser2IfNotExist(userFields, is_email_checked, grantedBy ?? "")
  const org = organization.type === CFA ? organization.cfa : organization.entreprise
  const orgId = org._id
  const { type } = organization
  await modifyPermissionToUser(
    {
      user_id: user._id,
      authorized_id: orgId.toString(),
      authorized_type: type === ENTREPRISE ? AccessEntityType.ENTREPRISE : AccessEntityType.CFA,
      origin: userFields.origin ?? "création de compte",
    },
    statusEvent ?? {
      reason: "création de compte",
      status: AccessStatus.AWAITING_VALIDATION,
      validation_type: VALIDATION_UTILISATEUR.AUTO,
    }
  )
  return user
}

export const createOpcoUser = async (
  userProps: IUserWithAccountFields,
  opco: OPCOS,
  { grantedBy, origin = "", reason = "" }: { reason?: string; origin?: string; grantedBy: string }
) => {
  const user = await createUser2IfNotExist(
    {
      ...userProps,
      last_action_date: new Date(),
      origin,
    },
    true,
    grantedBy
  )
  await modifyPermissionToUser(
    {
      user_id: user._id,
      authorized_id: opco,
      authorized_type: AccessEntityType.OPCO,
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

export const createAdminUser = async (userProps: IUserWithAccountFields, { grantedBy, origin = "", reason = "" }: { reason?: string; origin?: string; grantedBy: string }) => {
  const user = await createUser2IfNotExist(
    {
      ...userProps,
      last_action_date: new Date(),
      origin,
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

export const updateUserWithAccountFields = async (userId: ObjectId, fields: Partial<IUserWithAccountFields>): Promise<IUserWithAccount | { error: BusinessErrorCodes }> => {
  const { email, first_name, last_name, phone } = fields
  const newEmail = email?.toLocaleLowerCase()

  if (newEmail) {
    const exist = await getDbCollection("userswithaccounts").findOne({ email: newEmail, _id: { $ne: userId } })
    if (exist) {
      return { error: BusinessErrorCodes.EMAIL_ALREADY_EXISTS }
    }
  }

  const updatedFields = removeUndefinedFields({ ...fields, email: newEmail, updatedAt: new Date() })
  const newUser = await getDbCollection("userswithaccounts").findOneAndUpdate(
    { _id: userId },
    { $set: updatedFields },
    {
      returnDocument: "after",
    }
  )
  if (!newUser) {
    throw Boom.badRequest("user not found")
  }
  await getDbCollection("recruiters").updateMany(
    { "jobs.managed_by": userId.toString() },
    { $set: { ...removeUndefinedFields({ first_name, last_name, phone, email: newEmail }), updatedAt: new Date() } }
  )
  return newUser
}

export const removeUser = async (id: IUserWithAccount["_id"] | string) => {
  await getDbCollection("rolemanagements").deleteMany({ user_id: new ObjectId(id.toString()) })
}

/**
 * @description update last_connection user date
 * @param {IUserRecruteur["email"]} email
 * @returns {Promise<IUserRecruteur>}
 */
export const updateLastConnectionDate = async (email: IUserRecruteur["email"]): Promise<void> => {
  await getDbCollection("userswithaccounts").updateOne({ email: email.toLowerCase() }, { $set: { last_action_date: new Date(), updatedAt: new Date() } })
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
  const entreprise = await getDbCollection("entreprises").findOne({ _id: entrepriseId })
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
  await getDbCollection("entreprises").updateOne(
    { _id: entrepriseId },
    {
      $push: {
        status: event,
      },
      $set: {
        updatedAt: new Date(),
      },
    }
  )
}

const setAccessOfUserOnOrganization = async ({ user, organization }: UserAndOrganization, status: AccessStatus, origin: string, reason: string) => {
  const { type } = organization
  const orgId = type === CFA ? organization.cfa._id : organization.entreprise._id
  await modifyPermissionToUser(
    {
      user_id: user._id,
      authorized_id: orgId.toString(),
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
  const role = await getDbCollection("rolemanagements").findOne({ user_id: user._id, authorized_type: { $in: [AccessEntityType.ENTREPRISE, AccessEntityType.CFA] } })
  if (!role) {
    throw Boom.internal(`inattendu : pas de role pour user id=${user._id}`)
  }
  const isCfa = role.authorized_type === AccessEntityType.CFA
  let organization
  if (isCfa) {
    organization = await getDbCollection("cfas").findOne({ _id: new ObjectId(role.authorized_id) })
  } else {
    organization = await getDbCollection("entreprises").findOne({ _id: new ObjectId(role.authorized_id.toString()) })
  }
  if (!organization) {
    throw Boom.internal(`inattendu : pas d'organization pour user id=${user._id} et role id=${role._id}`)
  }
  await mailer.sendEmail({
    to: email,
    subject: "Bienvenue sur La bonne alternance",
    template: getStaticFilePath("./templates/mail-bienvenue.mjml.ejs"),
    data: {
      images: {
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
        logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
      },
      last_name: sanitizeForEmail(last_name),
      first_name: sanitizeForEmail(first_name),
      confirmation_url: createAuthMagicLink(userWithAccountToUserForToken(user)),
      email: sanitizeForEmail(user.email),
      establishment_name: organization.raison_sociale,
    },
  })
}

export const getAdminUsers = async () => {
  const allRoles = await getDbCollection("rolemanagements")
    .find({
      authorized_type: { $in: [AccessEntityType.ADMIN, AccessEntityType.OPCO] },
    })
    .toArray()
  const grantedRoles = allRoles.filter((role) => getLastStatusEvent(role.status)?.status === AccessStatus.GRANTED)
  const userIds = grantedRoles.map((role) => role.user_id)
  const users = await getDbCollection("userswithaccounts")
    .find({ _id: { $in: userIds } })
    .toArray()
  return users.map((user) => {
    return {
      ...user,
      type: grantedRoles.find((role) => role.user_id.toString() === user._id.toString())!.authorized_type as typeof AccessEntityType.ADMIN | typeof AccessEntityType.OPCO,
    }
  })
}

export const getUserRecruteursForManagement = async ({ opco, activeRoleLimit }: { opco?: OPCOS; activeRoleLimit?: number }) => {
  const nonGrantedRoles = await getDbCollection("rolemanagements")
    .find({ $expr: { $ne: [{ $arrayElemAt: ["$status.status", -1] }, AccessStatus.GRANTED] } })
    .toArray()
  const lastGrantedRoles = await getDbCollection("rolemanagements")
    .find({ $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, AccessStatus.GRANTED] } })
    .sort({ updatedAt: -1 })
    .limit(activeRoleLimit ?? 1000)
    .toArray()
  const roles = [...nonGrantedRoles, ...lastGrantedRoles]

  const userIds = roles.map((role) => role.user_id)
  const users = await getDbCollection("userswithaccounts")
    .find({ _id: { $in: userIds } })
    .toArray()

  const entrepriseIds = roles.flatMap((role) => (role.authorized_type === AccessEntityType.ENTREPRISE ? [new ObjectId(role.authorized_id.toString())] : []))
  const entreprises = await getDbCollection("entreprises")
    .find({ _id: { $in: entrepriseIds }, ...(opco ? { opco } : {}) })
    .toArray()

  const cfaIds = opco ? [] : roles.flatMap((role) => (role.authorized_type === AccessEntityType.CFA ? [new ObjectId(role.authorized_id)] : []))
  const cfas = cfaIds.length
    ? await getDbCollection("cfas")
        .find({ _id: { $in: cfaIds } })
        .toArray()
    : []

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
