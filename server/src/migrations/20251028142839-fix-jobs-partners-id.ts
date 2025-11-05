import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  logger.info("Fixing jobs_partners _id to match computed_jobs_partners")

  // Récupérer les documents avec des IDs différents
  const mismatchedDocs = await getDbCollection("jobs_partners")
    .aggregate([
      {
        $match: {
          partner_label: { $ne: "recruteurs_lba" },
          apply_email: null,
        },
      },
      {
        $lookup: {
          from: "computed_jobs_partners",
          let: {
            jp_id: "$_id",
            jp_partner_job_id: "$partner_job_id",
            jp_partner_label: "$partner_label",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$partner_job_id", "$$jp_partner_job_id"] }, { $eq: ["$partner_label", "$$jp_partner_label"] }],
                },
              },
            },
          ],
          as: "computed",
        },
      },
      {
        $match: {
          $expr: {
            $and: [{ $gt: [{ $size: "$computed" }, 0] }, { $ne: ["$_id", { $arrayElemAt: ["$computed._id", 0] }] }],
          },
        },
      },
      {
        $project: {
          old_id: "$_id",
          new_id: { $arrayElemAt: ["$computed._id", 0] },
          document: "$$ROOT",
        },
      },
    ])
    .toArray()

  logger.info(`Found ${mismatchedDocs.length} documents with mismatched _id`)

  let processed = 0
  let errors = 0

  for (const item of mismatchedDocs) {
    try {
      const { old_id, new_id, document } = item

      // Nettoyer le champ computed ajouté par l'aggregation ($$ROOT contient tout)
      delete document.computed

      // Remplacer l'_id par le bon
      document._id = new_id

      // Supprimer l'ancien document et insérer le nouveau avec le bon _id
      await getDbCollection("jobs_partners").deleteOne({ _id: old_id })
      await getDbCollection("jobs_partners").insertOne(document)

      processed++

      if (processed % 100 === 0) {
        logger.info(`Processed ${processed}/${mismatchedDocs.length} documents`)
      }
    } catch (error) {
      errors++
      logger.error(`Error processing document: ${error}`)
    }
  }

  logger.info(`Migration completed: ${processed} documents fixed, ${errors} errors`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
