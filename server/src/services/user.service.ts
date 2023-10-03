import type { FilterQuery } from "mongoose"
import { IRecruiter, IUserRecruteur } from "shared"

import { Recruiter, User, UserRecruteur } from "../common/model/index"
import { IUser } from "../common/model/schema/user/user.types"
import * as sha512Utils from "../common/utils/sha512Utils"

import { ETAT_UTILISATEUR } from "./constant.service"

/**
 * @description Hash password
 * @param {User} user
 * @param {string} password
 * @returns {Promise<IUser>}
 */
const rehashPassword = (user, password: string) => {
  user.password = sha512Utils.hash(password)

  return user.save()
}

/**
 * @description Authenticates user from its username and password.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<null|User>}
 */
const authenticate = async (username: string, password: string): Promise<IUser | null> => {
  const user = await getUser(username)

  if (!user) {
    return null
  }

  const current = user.password
  if (sha512Utils.compare(password, current)) {
    if (sha512Utils.isTooWeak(current)) {
      await rehashPassword(user, password)
    }

    return user.toObject()
  }

  return null
}

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
const createUser = async (username, password, options: Partial<IUser & { hash: string }>) => {
  const hash = options.hash || sha512Utils.hash(password)
  const { firstname, lastname, phone, email, role, type } = options

  const user = new User({
    username,
    password: hash,
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

/**
 * @description Updates user's password.
 * @param {string} username
 * @param {string} newPassword
 * @returns {Promise<IUser>}
 */
const changePassword = async (username: string, newPassword: string) => {
  const user = await User.findOne({ username })
  if (!user) {
    throw new Error(`Unable to find user ${username}`)
  }

  user.password = sha512Utils.hash(newPassword)

  return user.save()
}

type IUserRecruterPicked = Pick<
  IUserRecruteur,
  "_id" | "first_name" | "last_name" | "establishment_id" | "establishment_raison_sociale" | "establishment_siret" | "createdAt" | "email" | "phone"
>

type TReturnedType = {
  awaiting: Array<IUserRecruterPicked & { jobs_count: number; origin: string }>
  active: Array<IUserRecruterPicked & { jobs_count: number; origin: string }>
  disable: Array<IUserRecruterPicked & { jobs_count: number; origin: string }>
}

const getUserAndRecruitersDataForOpcoUser = async (opco): Promise<TReturnedType> => {
  const [users, recruiters]: [Array<IUserRecruterPicked & { status: IUserRecruteur["status"] }>, Pick<IRecruiter, "establishment_id" | "origin" | "jobs" | "_id">[]] =
    await Promise.all([
      UserRecruteur.find({
        $expr: { $ne: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.ERROR] },
        opco: opco,
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
        })
        .lean(),
      Recruiter.find({ opco: opco }).select({ establishment_id: 1, origin: 1, jobs: 1, _id: 0 }).lean(),
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

export { authenticate, changePassword, createUser, find, findOne, getUser, getUserAndRecruitersDataForOpcoUser, getUserById, getUserByMail, rehashPassword, update }
