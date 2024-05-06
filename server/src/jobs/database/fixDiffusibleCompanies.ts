import { ILbaCompany, IRecruiter, JOB_STATUS } from "shared"
import { EDiffusibleStatus } from "shared/constants/diffusibleStatus"
import { RECRUITER_STATUS } from "shared/constants/recruteur"
import { IEntreprise } from "shared/models/entreprise.model"
import { AccessEntityType } from "shared/models/roleManagement.model"

import { logger } from "@/common/logger"
import { Entreprise, Recruiter, RoleManagement } from "@/common/model"
import { db } from "@/common/mongodb"
import { getDiffusionStatus } from "@/services/etablissement.service"

const ANONYMIZED = "anonymized"
const FAKE_GEOLOCATION = "0,0"

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

      if (isDiffusible !== EDiffusibleStatus.DIFFUSIBLE) {
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
  console.info("deactivating non diffusible recruiter : ", recruiter.establishment_siret)
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

const deactivateEntreprise = async (entreprise: IEntreprise) => {
  const { siret } = entreprise
  console.info("deactivating non diffusible entreprise : ", siret)
  await Entreprise.deleteOne({ _id: entreprise._id })
  await RoleManagement.deleteMany({ authorized_type: AccessEntityType.ENTREPRISE, authorized_id: entreprise._id.toString() })
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

  const entreprises: AsyncIterable<IEntreprise> = await db.collection("entreprises").find({})

  count = 0
  deactivatedCount = 0
  errorCount = 0

  for await (const entreprise of entreprises) {
    if (count % 100 === 0) {
      logger.info(`${count} entreprises checked. ${deactivatedCount} removed. ${errorCount} errors`)
    }
    count++
    try {
      const { siret } = entreprise
      const isDiffusible = siret ? await getDiffusionStatus(siret) : EDiffusibleStatus.NOT_FOUND

      if (siret && isDiffusible !== EDiffusibleStatus.DIFFUSIBLE) {
        deactivateEntreprise(entreprise)

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
