import { randomUUID } from "crypto"
import { ModelUpdateOptions, UpdateQuery } from "mongoose"
import { Filter } from "mongodb"
import { UserRecruteur } from "../common/model/index.js"
import { IUserRecruteur } from "../common/model/schema/userRecruteur/userRecruteur.types.js"

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
export const updateUserValidationHistory = (userId: IUserRecruteur["_id"], state: UpdateQuery<IUserRecruteur["status"]>, options: ModelUpdateOptions = { new: true }) =>
  UserRecruteur.findByIdAndUpdate({ _id: userId }, { $push: { status: state } }, options)

/**
 * @description get last user validation state from status array, by creation date
 * @param {IUserRecruteur["status"]} stateArray
 * @returns {IUserRecruteur["status"]}
 */
export const getUserValidationState = (stateArray: IUserRecruteur["status"]) => stateArray.sort((a, b) => new Date(a.date).valueOf() - new Date(b.date).valueOf()).pop().status
