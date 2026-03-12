import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { parse } from "csv-parse/sync"
import { ObjectId } from "mongodb"
import { RECRUITER_STATUS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { JOB_STATUS } from "shared/models/job.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

interface CsvRow {
  id: string
  "cfa-delegated-siret": string
  "is-delegated": string
  "managed-by": string
}

export const cleanClosedCompanies = async (csvPath?: string) => {
  const filePath = typeof csvPath === "string" ? csvPath : join(__dirname, "companies-to-close.csv")
  const content = readFileSync(filePath, "utf-8")
  const rows: CsvRow[] = parse(content, { columns: true, skip_empty_lines: true })

  const now = new Date()

  logger.info(`cleanClosedCompanies: traitement de ${rows.length} lignes`)

  let successCount = 0
  let errorCount = 0

  await asyncForEach(rows, async (row, index) => {
    try {
      const recruiterId = new ObjectId(row.id)
      const managedBy = row["managed-by"]

      // 1. Archive le recruteur et annule ses offres actives
      await getDbCollection("recruiters").updateOne(
        { _id: recruiterId },
        {
          $set: {
            status: RECRUITER_STATUS.ARCHIVE,
            "jobs.$[elem].job_status": JOB_STATUS.ANNULEE,
          },
        },
        { arrayFilters: [{ "elem.job_status": JOB_STATUS.ACTIVE }] }
      )

      if (!managedBy) {
        successCount++
        return
      }

      const managedById = new ObjectId(managedBy)

      // 3. Désactive le rôle rolemanagement pour cette entreprise uniquement
      const recruiter = await getDbCollection("recruiters").findOne({ _id: recruiterId }, { projection: { establishment_siret: 1 } })
      const entreprise = recruiter ? await getDbCollection("entreprises").findOne({ siret: recruiter.establishment_siret }, { projection: { _id: 1 } }) : null
      const roleFilter = entreprise
        ? { user_id: managedById, authorized_type: AccessEntityType.ENTREPRISE, authorized_id: entreprise._id.toString() }
        : { user_id: managedById, authorized_type: AccessEntityType.ENTREPRISE }
      await getDbCollection("rolemanagements").updateMany(roleFilter, {
        $push: {
          status: {
            validation_type: VALIDATION_UTILISATEUR.AUTO,
            status: AccessStatus.DENIED,
            reason: "clôture siret fermé",
            granted_by: "SERVEUR",
            date: now,
          },
        },
      })

      successCount++
    } catch (error) {
      errorCount++
      logger.error(`cleanClosedCompanies: erreur sur la ligne ${index + 1} (id=${row.id}, managed-by=${row["managed-by"]})`, error)
    }
  })

  logger.info(`cleanClosedCompanies: terminé (${successCount} succès, ${errorCount} erreurs)`)
}
