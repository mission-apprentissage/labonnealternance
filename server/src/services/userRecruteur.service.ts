import { randomUUID } from "crypto"
import { ModelUpdateOptions, UpdateQuery } from "mongoose"
import { Filter } from "mongodb"
import { UserRecruteur } from "../common/model/index.js"
import { IUserRecruteur, IUserStatusValidation } from "../common/model/schema/userRecruteur/userRecruteur.types.js"
import { CFA, ETAT_UTILISATEUR, VALIDATION_UTILISATEUR } from "./constant.service.js"
import mailer from "./mailer.service.js"
import { mailTemplate } from "../assets/index.js"
import config from "../config.js"
import { createMagicLinkToken } from "../common/utils/jwtUtils.js"

/**
 * @description generate an API key
 * @returns {string}
 */
export const createApiKey = () => `mna-${randomUUID()}`

/**
 * @query get all user using a given query filter
 * @param {Filter<IUserRecruteur>} query
 * @param {Object} options
 * @param {Object} pagination
 * @param {Number} pagination.page
 * @param {Number} pagination.limit
 * @returns {Promise<IUserRecruteur>}
 */
export const getUsers = async (query: Filter<IUserRecruteur>, options, { page, limit }) => {
  const response = await UserRecruteur.paginate({ query, ...options, page, limit, lean: true, select: "-password" })
  return {
    pagination: {
      page: response.page,
      result_per_page: limit,
      number_of_page: response.totalPages,
      total: response.totalDocs,
    },
    data: response.docs,
  }
}

/**
 * @description get a single user using a given query filter
 * @param {Filter<IUserRecruteur>} query
 * @returns {Promise<IUserRecruteur>}
 */
export const getUser = async (query: Filter<IUserRecruteur>) => UserRecruteur.findOne(query)

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
export const updateUser = (query: Filter<IUserRecruteur>, update: UpdateQuery<IUserRecruteur>, options: ModelUpdateOptions = { new: true }) =>
  UserRecruteur.findOneAndUpdate(query, update, options)

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
export const registerUser = (email: IUserRecruteur["email"]) => UserRecruteur.findOneAndUpdate({ email }, { last_connection: new Date() })

/**
 * @description update user validation status
 * @param {IUserRecruteur["_id"]} userId
 * @param {UpdateQuery<IUserRecruteur["status"]} state
 * @param {ModelUpdateOptions} [options={new:true}]
 * @returns {Promise<IUserRecruteur>}
 */
export const updateUserValidationHistory = (userId: IUserRecruteur["_id"], state: UpdateQuery<IUserStatusValidation>, options: ModelUpdateOptions = { new: true }) =>
  UserRecruteur.findByIdAndUpdate({ _id: userId }, { $push: { status: state } }, options)

/**
 * @description get last user validation state from status array, by creation date
 * @param {IUserRecruteur["status"]} stateArray
 * @returns {IUserRecruteur["status"]}
 */
export const getUserValidationState = (stateArray: IUserRecruteur["status"]) => stateArray.sort((a, b) => new Date(a.date).valueOf() - new Date(b.date).valueOf()).pop().status

export const setUserInError = async (userId: IUserRecruteur["_id"], reason: string) =>
  await updateUserValidationHistory(userId, {
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    user: "SERVEUR",
    status: ETAT_UTILISATEUR.ERROR,
    reason,
  })

export const autoValidateUser = async (userId: IUserRecruteur["_id"]) =>
  await updateUserValidationHistory(userId, {
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    user: "SERVEUR",
    status: ETAT_UTILISATEUR.VALIDE,
  })

export const setUserHasToBeManuallyValidated = async (userId: IUserRecruteur["_id"]) =>
  await updateUserValidationHistory(userId, {
    validation_type: VALIDATION_UTILISATEUR.MANUAL,
    user: "SERVEUR",
    status: ETAT_UTILISATEUR.ATTENTE,
  })

export const deactivateUser = async (userId: IUserRecruteur["_id"]) =>
  await updateUserValidationHistory(userId, {
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    user: "SERVEUR",
    status: ETAT_UTILISATEUR.DESACTIVE,
  })

export const sendWelcomeEmailToUserRecruteur = async (userRecruteur: IUserRecruteur) => {
  const { email, first_name, last_name, establishment_raison_sociale, type } = userRecruteur
  const magiclink = `${config.publicUrlEspacePro}/authentification/verification?token=${createMagicLinkToken(email)}`
  await mailer.sendEmail({
    to: email,
    subject: "Bienvenue sur La bonne alternance",
    template: mailTemplate["mail-bienvenue"],
    data: {
      images: {
        logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
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
