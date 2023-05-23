import { randomUUID } from "crypto"
import { UserRecruteur } from "../model/index.js"
import { ModelUpdateOptions, UpdateQuery } from "mongoose"
import { IUserRecruteur } from "../model/schema/userRecruteur/userRecruteur.types.js"
import { Filter } from "mongodb"

export default () => ({
  createApiKey: () => `mna-${randomUUID()}`,
  getUsers: async (query: Filter<IUserRecruteur>, options, { page, limit }) => {
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
  },
  getUser: (query: Filter<IUserRecruteur>) => UserRecruteur.findOne(query),
  createUser: async (values) => {
    let scope = values.scope ?? undefined

    if (!scope) {
      if (values.type === "CFA") {
        // generate user scope
        const [key] = randomUUID().split("-")
        scope = `cfa-${key}`
      } else {
        scope = `etp-${values.establishment_raison_sociale.toLowerCase().replace(/ /g, "-")}`
      }
    }

    const user = new UserRecruteur({
      ...values,
      scope: scope,
    })

    await user.save()
    return user.toObject()
  },
  updateUser: (query: Filter<IUserRecruteur>, update: UpdateQuery<IUserRecruteur>, options: ModelUpdateOptions = { new: true }) =>
    UserRecruteur.findOneAndUpdate(query, update, options),
  removeUser: async (id: IUserRecruteur["_id"]) => {
    const user = await UserRecruteur.findById(id)
    if (!user) {
      throw new Error(`Unable to find user ${id}`)
    }

    return await user.deleteOne({ _id: id })
  },
  registerUser: (email: IUserRecruteur["email"]) => UserRecruteur.findOneAndUpdate({ email }, { last_connection: new Date() }),
  updateUserValidationHistory: (userId: IUserRecruteur["_id"], state: UpdateQuery<IUserRecruteur["status"]>, options: ModelUpdateOptions = { new: true }) =>
    UserRecruteur.findByIdAndUpdate({ _id: userId }, { $push: { status: state } }, options),
  getUserValidationState: (stateArray: IUserRecruteur["status"]) => stateArray.sort((a, b) => new Date(a.date).valueOf() - new Date(b.date).valueOf()).pop().status,
})
