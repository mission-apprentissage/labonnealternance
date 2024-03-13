import type { FilterQuery } from "mongoose"
import { IUser } from "shared"
import { ETAT_UTILISATEUR, OPCOS } from "shared/constants/recruteur"
import { IUserForOpco } from "shared/routes/user.routes"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { ObjectId } from "@/common/mongodb"

import { Recruiter, User, User2, UserRecruteur } from "../common/model/index"

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

export const getUserAndRecruitersDataForOpcoUser = async (
  opco: OPCOS
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
      const status = getLastStatusEvent(user.status)?.status
      if (status === null) {
        return acc
      }
      const recruiter = recruiterPerEtablissement.get(user.establishment_id)

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
        jobs_count: recruiter?.jobs?.length ?? 0,
        origin: recruiter?.origin ?? "",
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

export const getUserNamesFromIds = async (ids: string[]) => {
  const deduplicatedIds = [...new Set(ids)].filter((id) => ObjectId.isValid(id))
  const users = await User2.find({ _id: { $in: deduplicatedIds } }).lean()
  return users
}

export { createUser, find, findOne, getUserById, getUserByMail, update }
