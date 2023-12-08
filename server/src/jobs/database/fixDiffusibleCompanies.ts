import { setTimeout } from "timers/promises"

import Boom from "boom"
import { ILbaCompany, IRecruiter, IUserRecruteur, JOB_STATUS } from "shared"
import { EDiffusibleStatus } from "shared/constants/diffusibleStatus"
import { ETAT_UTILISATEUR, RECRUITER_STATUS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"

import { logger } from "@/common/logger"
import { Recruiter, UserRecruteur } from "@/common/model"
import { db } from "@/common/mongodb"
import { getEtablissementDiffusionStatus } from "@/services/etablissement.service"

const MAX_RETRY = 100
const DELAY = 100
const ANONYMIZED = "anonymized"
const FAKE_GEOLOCATION = "0,0"

const getDiffusionStatus = async (siret: string, count = 1) => {
  const isDiffusible = await getEtablissementDiffusionStatus(siret)
  if (isDiffusible === "quota") {
    if (count > MAX_RETRY) throw Boom.internal(`Api entreprise or cache entreprise not availabe. Tried ${MAX_RETRY} times`)
    await setTimeout(DELAY, "result")
    return await getDiffusionStatus(siret, count++)
  }
  return isDiffusible
}

const fixLbaCompanies = async () => {
  logger.info(`Fixing diffusible lba companies`)
  const lbaCompanies: AsyncIterable<ILbaCompany> = await db.collection("bonnesboites").find({})

  let count = 0
  let deletedCount = 0
  let errorCount = 0
  for await (const lbaCompany of lbaCompanies) {
    if (count % 500 === 0) {
      logger.info(`${count} companies checked. ${deletedCount} removed. ${errorCount} errors`)
    }
    count++
    try {
      const isDiffusible = await getDiffusionStatus(lbaCompany.siret)

      if (isDiffusible !== "diffusible") {
        await db.collection("bonnesboites").deleteOne({ siret: lbaCompany.siret })
        deletedCount++
      }
    } catch (err) {
      errorCount++
      console.log(err)
      break
    }
  }
  logger.info(`Final result : ${count} companies checked. ${deletedCount} removed. ${errorCount} errors`)

  logger.info(`Fixing lba companies done`)
}

const deactivateRecruiter = async (recruiter: IRecruiter) => {
  console.log("deactivating non diffusible recruiter : ", recruiter.establishment_siret)
  recruiter.status = RECRUITER_STATUS.ARCHIVE
  recruiter.address = ANONYMIZED
  recruiter.geo_coordinates = FAKE_GEOLOCATION
  recruiter.address_detail = recruiter.address_detail
    ? { status_diffusion: recruiter.address_detail.status_diffusion, libelle_commune: ANONYMIZED }
    : { libelle_commune: ANONYMIZED }

  for await (const job of recruiter.jobs) {
    job.job_status = JOB_STATUS.ACTIVE ? JOB_STATUS.ANNULEE : job.job_status
  }

  await Recruiter.updateOne({ _id: recruiter._id }, { $set: { ...recruiter } })
}

const deactivateUserRecruteur = async (userRecruteur: IUserRecruteur) => {
  console.log("deactivating non diffusible userRecruteur : ", userRecruteur.establishment_siret)

  const userStatus = {
    user: "SERVEUR",
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    status: ETAT_UTILISATEUR.DESACTIVE,
    reason: "Anonymisation des données",
    date: new Date(),
  }
  if (!userRecruteur.status) {
    userRecruteur.status = []
  }
  const lastStatus = userRecruteur.status.at(-1)
  if (lastStatus && lastStatus.status !== ETAT_UTILISATEUR.DESACTIVE) {
    userRecruteur.status.push(userStatus)
  }

  // TODO: ICI faire en sorte de restaurer un user ADMIN et ne pas chercher à désactiver les siret undefined

  userRecruteur.address = ANONYMIZED
  userRecruteur.geo_coordinates = FAKE_GEOLOCATION

  if (userRecruteur.address_detail) {
    userRecruteur.address_detail = { libelle_commune: ANONYMIZED }
  }

  await UserRecruteur.updateOne({ _id: userRecruteur._id }, { $set: { ...userRecruteur } })
}

const fixRecruiters = async () => {
  logger.info(`Fixing diffusible recruiters and offers`)
  const recruiters: AsyncIterable<IRecruiter> = await db.collection("recruiters").find({})

  let count = 0
  let deactivatedCount = 0
  let errorCount = 0
  for await (const recruiter of recruiters) {
    if (count % 100 === 0) {
      logger.info(`${count} recruiters checked. ${deactivatedCount} removed. ${errorCount} errors`)
    }
    count++
    try {
      const isDiffusible = await getDiffusionStatus(recruiter.establishment_siret)

      if (isDiffusible !== EDiffusibleStatus.DIFFUSIBLE) {
        deactivateRecruiter(recruiter)

        deactivatedCount++
      }
    } catch (err) {
      errorCount++
      console.log(err)
      break
    }
  }

  const userRecruteurs: AsyncIterable<IUserRecruteur> = await db.collection("userrecruteurs").find({})

  count = 0
  deactivatedCount = 0
  errorCount = 0
  for await (const userRecruteur of userRecruteurs) {
    if (count % 100 === 0) {
      logger.info(`${count} userRecruteurs checked. ${deactivatedCount} removed. ${errorCount} errors`)
    }
    count++
    try {
      const isDiffusible = userRecruteur.establishment_siret ? await getDiffusionStatus(userRecruteur.establishment_siret) : EDiffusibleStatus.NOT_FOUND

      if (isDiffusible !== EDiffusibleStatus.DIFFUSIBLE) {
        deactivateUserRecruteur(userRecruteur)

        deactivatedCount++
      }
    } catch (err) {
      errorCount++
      console.log(err)
      break
    }
  }
}

export async function fixDiffusibleCompanies(payload: { collection_list?: string }): Promise<void> {
  const collectionList = payload?.collection_list ?? "lbacompanies,recruiters"
  const list = collectionList.split(",")

  if (list.includes("lbacompanies")) {
    await fixLbaCompanies()
  }

  if (list.includes("recruiters")) {
    await fixRecruiters()
  }
}

export async function checkDiffusibleCompanies(): Promise<void> {
  logger.info(`Checking diffusible sirets`)
  const sirets: AsyncIterable<{ _id: string }> = await db.collection("tmp_siret").find({})

  let count = 0
  let nonDiffusibleCount = 0
  let partiellementDiffusibleCount = 0
  let unavailableCount = 0
  let notFoundCount = 0
  let errorCount = 0

  for await (const { _id } of sirets) {
    if (count % 100 === 0) {
      logger.info(
        `${count} sirets checked. ${partiellementDiffusibleCount} partDiff. ${unavailableCount} indisp. ${notFoundCount} non trouvé. ${nonDiffusibleCount} nonDiff. ${errorCount} errors`
      )
    }
    count++
    try {
      const isDiffusible = await getDiffusionStatus(_id)

      switch (isDiffusible) {
        case EDiffusibleStatus.NON_DIFFUSIBLE: {
          nonDiffusibleCount++
          break
        }
        case EDiffusibleStatus.PARTIELLEMENT_DIFFUSIBLE: {
          partiellementDiffusibleCount++
          break
        }
        case EDiffusibleStatus.UNAVAILABLE: {
          unavailableCount++
          break
        }
        case EDiffusibleStatus.NOT_FOUND: {
          notFoundCount++
          break
        }
        default:
      }
    } catch (err) {
      errorCount++
      console.log(err)
      break
    }
  }
  logger.info(
    `FIN : ${count} companies checked. ${partiellementDiffusibleCount} partDiff. ${unavailableCount} indisp. ${notFoundCount} non trouvé. ${nonDiffusibleCount} nonDiff. ${errorCount} errors`
  )

  logger.info(`Checking sirets done`)
}
