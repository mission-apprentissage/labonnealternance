import { randomUUID } from "crypto"

import Boom from "boom"
import type { FilterQuery, ModelUpdateOptions, UpdateQuery } from "mongoose"
import { IUserRecruteur, IUserStatusValidation } from "shared"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { UserRecruteur } from "../common/model/index"
import { createMagicLinkToken } from "../common/utils/jwtUtils"
import config from "../config"

import { CFA, ENTREPRISE, ETAT_UTILISATEUR, VALIDATION_UTILISATEUR, ADMIN } from "./constant.service"
import mailer from "./mailer.service"

/**
 * @description generate an API key
 * @returns {string}
 */
export const createApiKey = (): string => `mna-${randomUUID()}`

/**
 * @query get all user using a given query filter
 * @param {Filter<IUserRecruteur>} query
 * @param {Object} options
 * @param {Object} pagination
 * @param {Number} pagination.page
 * @param {Number} pagination.limit
 * @returns {Promise<IUserRecruteur>}
 */
export const getUsers = async (query: FilterQuery<IUserRecruteur>, options, { page, limit }) => {
  const response = await UserRecruteur.paginate({ query, ...options, page, limit, lean: true, select: "-password" })
  return {
    pagination: {
      page: response?.page,
      result_per_page: limit,
      number_of_page: response?.totalPages,
      total: response?.totalDocs,
    },
    data: response?.docs,
  }
}

/**
 * @description get a single user using a given query filter
 * @param {Filter<IUserRecruteur>} query
 * @returns {Promise<IUserRecruteur>}
 */
export const getUser = async (query: FilterQuery<IUserRecruteur>): Promise<IUserRecruteur | null> => UserRecruteur.findOne(query).lean()

/**
 * @description create user
 * @param {IUserRecruteur} values
 * @returns {IUserRecruteur}
 */
export const createUser = async (values) => {
  let scope = values.scope ?? undefined

  const formatedEmail = values.email.toLocaleLowerCase()

  if (!scope) {
    if (values.type === "CFA") {
      // generate user scope
      const [key] = randomUUID().split("-")
      scope = `cfa-${key}`
    } else {
      let key
      if (values?.establishment_raison_sociale) {
        key = values.establishment_raison_sociale.toLowerCase().replace(/ /g, "-")
      } else {
        key = randomUUID().split("-")[0]
      }
      scope = `etp-${key}`
    }
  }

  const user = new UserRecruteur({
    ...values,
    scope: scope,
    email: formatedEmail,
  })

  await user.save()
  return user.toObject()
}

/**
 * @description update user
 * @param {Filter<IUserRecruteur>} query
 * @param {UpdateQuery<IUserRecruteur>} update
 * @param {ModelUpdateOptions} options
 * @returns {Promise<IUserRecruteur>}
 */
export const updateUser = async (query: FilterQuery<IUserRecruteur>, update: UpdateQuery<IUserRecruteur>, options: ModelUpdateOptions = { new: true }): Promise<IUserRecruteur> => {
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
export const removeUser = async (id: IUserRecruteur["_id"]) => {
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
export const registerUser = (email: IUserRecruteur["email"]) => UserRecruteur.findOneAndUpdate({ email: email }, { last_connection: new Date() })

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
export const getUserStatus = (stateArray: IUserRecruteur["status"]) => {
  const sortedArray = [...stateArray].sort((a, b) => new Date(a.date).valueOf() - new Date(b.date).valueOf())
  const lastValidationEvent = sortedArray.at(sortedArray.length - 1)
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
  const magiclink = `${config.publicUrl}/espace-pro/authentification/verification?token=${createMagicLinkToken(email)}`
  await mailer.sendEmail({
    to: email,
    subject: "Bienvenue sur La bonne alternance",
    template: getStaticFilePath("./templates/mail-bienvenue.mjml.ejs"),
    data: {
      images: {
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
      },
      establishment_raison_sociale,
      last_name,
      first_name,
      email,
      is_delegated: type === CFA,
      url: magiclink,
    },
  })
}

const projection = {
  _id: 1,
  establishment_id: 1,
  establishment_raison_sociale: 1,
  establishment_siret: 1,
  type: 1,
  first_name: 1,
  last_name: 1,
  email: 1,
  phone: 1,
  createdAt: 1,
  origin: 1,
  opco: 1,
  status: 1,
}

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
