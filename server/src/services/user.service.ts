import Boom from "boom"
import type { FilterQuery } from "mongoose"
import { IUser } from "shared"
import { ETAT_UTILISATEUR, OPCOS } from "shared/constants/recruteur"
import { IUserForOpco } from "shared/routes/user.routes"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { ObjectId } from "@/common/mongodb"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { User, UserWithAccount } from "../common/model/index"

import { getUserRecruteursForManagement } from "./userRecruteur.service"

const createOrUpdateUserByEmail = async (email: string, update: Partial<IUser>, create: Partial<IUser>): Promise<{ user: IUser; isNew: boolean }> => {
  const newUserId = new ObjectId()
  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: update,
      $setOnInsert: { _id: newUserId, ...create },
    },
    {
      upsert: true,
      new: true,
    }
  )

  return {
    user,
    // If the user is new, we will have to update the _id with the default one
    isNew: user._id.equals(newUserId),
  }
}

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
  const userRecruteurs = await getUserRecruteursForManagement({ opco })
  const filteredUserRecruteurs = [...userRecruteurs.active, ...userRecruteurs.awaiting, ...userRecruteurs.disabled]
  const userIds = [...new Set(filteredUserRecruteurs.map(({ _id }) => _id.toString()))]
  const recruiters = await getDbCollection("recruiters")
    .find({ "jobs.managed_by": { $in: userIds } }, { projection: { establishment_id: 1, origin: 1, jobs: 1, _id: 0 } })
    .toArray()

  const recruiterMap = new Map<string, (typeof recruiters)[0]>()
  recruiters.forEach((recruiter) => {
    recruiter.jobs.forEach((job) => {
      if (!job.managed_by) {
        throw Boom.internal(`inattendu: managed_by vide pour le job avec id=${job._id}`)
      }
      recruiterMap.set(job.managed_by.toString(), recruiter)
    })
  })

  const results = filteredUserRecruteurs.reduce(
    (acc, userRecruteur) => {
      const status = getLastStatusEvent(userRecruteur.status)?.status
      if (!status) return acc
      const recruiter = recruiterMap.get(userRecruteur._id.toString())
      const { establishment_id } = recruiter ?? {}
      const { _id, first_name, last_name, establishment_raison_sociale, establishment_siret, createdAt, email, phone, type, organizationId } = userRecruteur
      const userForOpco: IUserForOpco = {
        _id,
        first_name,
        last_name,
        establishment_raison_sociale,
        establishment_siret,
        establishment_id,
        createdAt,
        email,
        phone,
        type,
        jobs_count: recruiter?.jobs?.length ?? 0,
        origin: recruiter?.origin ?? "",
        organizationId,
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
  const users = await UserWithAccount.find({ _id: { $in: deduplicatedIds } }).lean()
  return users
}

export { createOrUpdateUserByEmail, createUser, find, findOne, getUserById, getUserByMail, update }
