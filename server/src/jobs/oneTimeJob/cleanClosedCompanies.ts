import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { parse } from "csv-parse/sync"
import { ObjectId } from "mongodb"
import { RECRUITER_STATUS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { JOB_STATUS } from "shared/models/job.model"
import { AccessStatus } from "shared/models/roleManagement.model"
import { UserEventType } from "shared/models/userWithAccount.model"

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
  const filePath = csvPath ?? join(__dirname, "companies-to-close.csv")
  const content = readFileSync(filePath, "utf-8")
  const rows: CsvRow[] = parse(content, { columns: true, skip_empty_lines: true })

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "") // Format YYYYMMDD
  const now = new Date()

  console.info(`cleanClosedCompanies: traitement de ${rows.length} lignes`)

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

      // 2. Désactive l'utilisateur et modifie l'email
      await getDbCollection("userswithaccounts").updateOne(
        { _id: managedById },
        {
          $push: {
            status: {
              validation_type: VALIDATION_UTILISATEUR.AUTO,
              status: UserEventType.DESACTIVE,
              reason: "clôture siret fermé",
              granted_by: "migration",
              date: now,
            },
          },
          $set: { email: `support-${dateStr}-${managedBy}@apprentissage.beta.gouv.fr` },
        }
      )

      // 3. Désactive les accès rolemanagement
      await getDbCollection("rolemanagements").updateMany(
        { user_id: managedById },
        {
          $push: {
            status: {
              validation_type: VALIDATION_UTILISATEUR.AUTO,
              status: AccessStatus.DENIED,
              reason: "clôture siret fermé",
              granted_by: "SERVEUR",
              date: now,
            },
          },
        }
      )

      successCount++
    } catch (error) {
      errorCount++
      console.error(`cleanClosedCompanies: erreur sur la ligne ${index + 1} (id=${row.id}, managed-by=${row["managed-by"]})`, error)
    }
  })

  console.info(`cleanClosedCompanies: terminé (${successCount} succès, ${errorCount} erreurs)`)
}
