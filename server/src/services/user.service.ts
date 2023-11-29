import type { FilterQuery } from "mongoose"
import { IRecruiter, IUserRecruteur } from "shared"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

import { Recruiter, User, UserRecruteur } from "../common/model/index"
import { IUser } from "../common/model/schema/user/user.types"

/**
 * @description Returns user from its username.
 * @param {string} username
 * @returns {Promise<IUser>}
 */
const getUser = (username: string) => User.findOne({ username })

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

type IUserRecruterPicked = Pick<
  IUserRecruteur,
  "_id" | "first_name" | "last_name" | "establishment_id" | "establishment_raison_sociale" | "establishment_siret" | "createdAt" | "email" | "phone" | "type"
>

type TReturnedType = {
  awaiting: Array<IUserRecruterPicked & { jobs_count: number; origin: string }>
  active: Array<IUserRecruterPicked & { jobs_count: number; origin: string }>
  disable: Array<IUserRecruterPicked & { jobs_count: number; origin: string }>
}

const getUserAndRecruitersDataForOpcoUser = async (opco: string): Promise<TReturnedType> => {
  const [users, recruiters]: [Array<IUserRecruterPicked & { status: IUserRecruteur["status"] }>, Pick<IRecruiter, "establishment_id" | "origin" | "jobs" | "_id">[]] =
    await Promise.all([
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

      const { status: _status, ...rest } = user
      const u = {
        ...rest,
        jobs_count: form?.jobs?.length ?? 0,
        origin: form?.origin ?? "",
      }

      if (status === ETAT_UTILISATEUR.ATTENTE) {
        acc.awaiting.push(u)
      }
      if (status === ETAT_UTILISATEUR.VALIDE) {
        acc.active.push(u)
      }
      if (status === ETAT_UTILISATEUR.DESACTIVE) {
        acc.disable.push(u)
      }

      return acc
    },
    {
      awaiting: [],
      active: [],
      disable: [],
    } as TReturnedType
  )
  return results
}

export { createUser, find, findOne, getUser, getUserAndRecruitersDataForOpcoUser, getUserById, getUserByMail, update }
