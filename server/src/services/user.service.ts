import { randomUUID } from "crypto"

import { internal } from "@hapi/boom"
import { ObjectId } from "mongodb"
import type { IUser } from "shared"
import type { OPCOS_LABEL } from "shared/constants/recruteur"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import type { IUserForOpco } from "shared/routes/user.routes"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { getUserRecruteursForManagement } from "./userRecruteur.service"
import { buildEstablishmentId } from "./etablissement.service"
import { getDbCollection } from "@/common/utils/mongodbUtils"

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
  const userIds = [...new Set(filteredUserRecruteurs.map(({ _id }) => _id))]

  type ProjectedJobPartner = Pick<IJobsPartnersOfferPrivate, "offer_origin" | "managed_by">
  const jobPartners = (await getDbCollection("jobs_partners")
    .find(
      {
        managed_by: { $in: userIds },
        workplace_opco: opco,
      },
      {
        projection: {
          offer_origin: 1,
          managed_by: 1,
        },
      }
    )
    .toArray()) as ProjectedJobPartner[]

  const jobsByUser = new Map<string, ProjectedJobPartner[]>()
  jobPartners.forEach((job) => {
    const { managed_by } = job
    if (managed_by) {
      const managedByStr = managed_by.toString()
      let group = jobsByUser.get(managedByStr)
      if (!group) {
        group = []
        jobsByUser.set(managedByStr, group)
      }
      group.push(job)
    }
  })

  const results = filteredUserRecruteurs.reduce(
    (acc, userRecruteur) => {
      const status = getLastStatusEvent(userRecruteur.status)?.status
      if (!status) return acc
      const { _id, first_name, last_name, establishment_raison_sociale, establishment_siret, createdAt, email, phone, type, organizationId } = userRecruteur
      const establishment_id = establishment_siret ? buildEstablishmentId(_id, establishment_siret) : undefined
      const jobs = jobsByUser.get(userRecruteur._id.toString()) ?? []
      const firstJob = jobs.at(0)
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
        jobs_count: jobs?.length ?? 0,
        origin: firstJob?.offer_origin ?? "",
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
