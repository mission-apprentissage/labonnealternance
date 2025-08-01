import { randomUUID } from "crypto"

import { internal } from "@hapi/boom"
import { ObjectId } from "mongodb"
import { IUser } from "shared"
import { ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/recruteur"
import { IUserForOpco } from "shared/routes/user.routes"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { getUserRecruteursForManagement } from "./userRecruteur.service"

export const createOrUpdateUserByEmail = async (email: string, update: Partial<IUser>, create: Partial<IUser>): Promise<{ user: IUser; isNew: boolean }> => {
  const newUserId = new ObjectId()
  await getDbCollection("users").findOneAndUpdate(
    { email },
    {
      $set: update,
      $setOnInsert: { _id: newUserId, ...create },
    },
    {
      upsert: true,
    }
  )
  const savedUser = await getDbCollection("users").findOne({ email })
  if (!savedUser) {
    throw internal("inattendu : user non sauvegardé")
  }

  return {
    user: savedUser,
    // If the user is new, we will have to update the _id with the default one
    isNew: savedUser._id.equals(newUserId),
  }
}

export const cleanHardbouncedAppointmentUser = async (email: string) => {
  const fakeEmail = `email-blacklist-par-lba-${randomUUID()}@faux-domaine.fr`
  await getDbCollection("users").findOneAndUpdate(
    { email },
    {
      $set: { email: fakeEmail },
    }
  )
}

export const getUserAndRecruitersDataForOpcoUser = async (
  opco: OPCOS_LABEL
): Promise<{
  awaiting: IUserForOpco[]
  active: IUserForOpco[]
  disable: IUserForOpco[]
}> => {
  const userRecruteurs = await getUserRecruteursForManagement({ opco })

  const filteredUserRecruteurs = [...userRecruteurs.active, ...userRecruteurs.awaiting, ...userRecruteurs.disabled]
  const userIds = [...new Set(filteredUserRecruteurs.map(({ _id }) => _id.toString()))]
  const recruiters = await getDbCollection("recruiters")
    .find({ managed_by: { $in: userIds }, opco }, { projection: { establishment_id: 1, origin: 1, jobs: 1, managed_by: 1, _id: 0 } })
    .toArray()

  const recruiterMap = new Map<string, (typeof recruiters)[0]>()
  recruiters.forEach((recruiter) => {
    recruiterMap.set(recruiter.managed_by.toString(), recruiter)
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
  const deduplicatedIds = [...new Set(ids)].filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))
  const users = await getDbCollection("userswithaccounts")
    .find({ _id: { $in: deduplicatedIds } })
    .toArray()
  return users
}
