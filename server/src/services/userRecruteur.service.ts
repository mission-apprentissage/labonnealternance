import { randomUUID } from "crypto"

import Boom from "boom"
import type { FilterQuery, ModelUpdateOptions, UpdateQuery } from "mongoose"
import { IUserRecruteur, IUserRecruteurWritable, IUserStatusValidation } from "shared"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { UserRecruteur } from "../common/model/index"
import config from "../config"

import { createAuthMagicLink } from "./appLinks.service"
import { ADMIN } from "./constant.service"
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
  const response = await UserRecruteur.paginate({ query, ...options, page, limit, lean: true })
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
export const getUserStatus = (stateArray: IUserRecruteur["status"]) => {
  const sortedArray = [...stateArray].sort((a, b) => new Date(a?.date ?? 0).valueOf() - new Date(b?.date ?? 0).valueOf())
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
      url: createAuthMagicLink(userRecruteur),
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
