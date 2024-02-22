import type { FilterQuery } from "mongoose"
import { IUser, IUserRecruteur } from "shared"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import { IUserForOpco } from "shared/routes/user.routes"

import { Recruiter, User, UserRecruteur } from "../common/model/index"

/**
 * @description Returns user from its email.
 * @param {string} email
 * @returns {Promise<IUser>}
 */
const getUserByMail = (email: string) => User.findOne({ email })

/**
 * @description Returns user from its identifier.
 * @param {string} userId
 * @returns {Promise<IUser>}
 */
const getUserById = (userId: string) => User.findById(userId)

/**
 * @description Updates item.
 * @param {String} id - ObjectId
 * @param {User} params
 * @returns {Promise<User>}
 */
const update = (id: string, params) => User.findOneAndUpdate({ _id: id }, params, { new: true })

/**
 * @description Creates an user.
 * @param {String} username
 * @param {String} password
 * @param {User} options
 * @returns {Promise<User>}
 */
const createUser = async (options: Partial<IUser>) => {
  const { firstname, lastname, phone, email, role, type } = options

  const user = new User({
    firstname,
    lastname,
    phone,
    email,
    role,
    type,
  })

  return user.save()
}

/**
 * @description Returns items.
 * @param {FilterQuery<IUser>} conditions
 * @returns {Promise<User[]>}
 */
const find = (conditions: FilterQuery<IUser>) => User.find(conditions)

/**
 * @description Returns one item.
 * @param {FilterQuery<IUser>} conditions
 * @returns {Promise<User>}
 */
const findOne = (conditions: FilterQuery<IUser>) => User.findOne(conditions)

const getUserAndRecruitersDataForOpcoUser = async (
  opco: string
): Promise<{
  awaiting: IUserForOpco[]
  active: IUserForOpco[]
  disable: IUserForOpco[]
}> => {
  const [users, recruiters] = await Promise.all([
    UserRecruteur.find({
      $expr: { $ne: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.ERROR] },
      opco,
    })
      .select({
        _id: 1,
        first_name: 1,
        last_name: 1,
        establishment_id: 1,
        establishment_raison_sociale: 1,
        establishment_siret: 1,
        createdAt: 1,
        email: 1,
        phone: 1,
        status: 1,
        type: 1,
      })
      .lean(),
    Recruiter.find({ opco }).select({ establishment_id: 1, origin: 1, jobs: 1, _id: 0 }).lean(),
  ])

  const recruiterPerEtablissement = new Map()
  for (const recruiter of recruiters) {
    recruiterPerEtablissement.set(recruiter.establishment_id, recruiter)
  }

  const results = users.reduce(
    (acc, user) => {
      const status = user.status?.at(-1)?.status ?? null
      if (status === null) {
        return acc
      }
      const form = recruiterPerEtablissement.get(user.establishment_id)

      const { _id, first_name, last_name, establishment_id, establishment_raison_sociale, establishment_siret, createdAt, email, phone, type } = user
      const userForOpco: IUserForOpco = {
        _id,
        first_name,
        last_name,
        establishment_id,
        establishment_raison_sociale,
        establishment_siret,
        createdAt,
        email,
        phone,
        type,
        jobs_count: form?.jobs?.length ?? 0,
        origin: form?.origin ?? "",
      }
      if (status === ETAT_UTILISATEUR.ATTENTE) {
        acc.awaiting.push(userForOpco)
      }
      if (status === ETAT_UTILISATEUR.VALIDE) {
        acc.active.push(userForOpco)
      }
      if (status === ETAT_UTILISATEUR.DESACTIVE) {
        acc.disable.push(userForOpco)
      }
      return acc
    },
    {
      awaiting: [] as IUserForOpco[],
      active: [] as IUserForOpco[],
      disable: [] as IUserForOpco[],
    }
  )
  return results
}

const getValidatorIdentityFromStatus = async (status: IUserRecruteur["status"]) => {
  return await Promise.all(
    status.map(async (state) => {
      if (state.user === "SERVEUR") return state
      const user = await UserRecruteur.findById(state.user).select({ first_name: 1, last_name: 1, _id: 0 }).lean()
      return { ...state, user: `${user?.first_name} ${user?.last_name}` }
    })
  )
}

export { createUser, find, findOne, getUserAndRecruitersDataForOpcoUser, getUserById, getUserByMail, getValidatorIdentityFromStatus, update }
