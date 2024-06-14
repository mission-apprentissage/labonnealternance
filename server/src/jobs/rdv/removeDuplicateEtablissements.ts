import { IEtablissement } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { asyncForEach } from "../../common/utils/asyncUtils"

function findDocumentWithMostFields(documents: Array<Partial<IEtablissement>>): Partial<IEtablissement> | null {
  if (!Array.isArray(documents) || documents.length === 0) {
    return null // Handle invalid input
  }

  let maxFieldsCount = -1
  let documentWithMostFields

  documents.forEach((document) => {
    if (typeof document === "object" && document !== null) {
      const fieldsCount = Object.values(document).filter((value) => value !== null && value !== undefined).length

      if (fieldsCount > maxFieldsCount) {
        maxFieldsCount = fieldsCount
        documentWithMostFields = document
      }
    }
  })

  return documentWithMostFields
}

export const removeDuplicateEtablissements = async () => {
  const duplicates: Array<{ duplicateDocuments: Partial<IEtablissement>[] }> = (await getDbCollection("etablissements")
    .aggregate([
      {
        $group: {
          _id: {
            gestionnaire_siret: "$gestionnaire_siret",
            formateur_siret: "$formateur_siret",
          },
          count: { $sum: 1 },
          documents: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          duplicateDocuments: "$documents",
        },
      },
    ])
    .toArray()) as Array<{ duplicateDocuments: Partial<IEtablissement>[] }>
  if (!duplicates.length) return

  logger.info(`${duplicates.length} etablissements duplicated to control`)

  await asyncForEach(duplicates, async (duplicate) => {
    const documentToKeep = findDocumentWithMostFields(duplicate.duplicateDocuments)
    if (!documentToKeep) return
    const documentsToRemove = duplicate.duplicateDocuments.filter((doc) => doc._id != documentToKeep._id)
    await Promise.all(documentsToRemove.map(async (etablissement) => await getDbCollection("etablissements").deleteOne({ _id: etablissement._id })))
  })
}
