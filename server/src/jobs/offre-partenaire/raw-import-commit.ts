import { internal } from "@hapi/boom"
import type { CollectionName } from "shared/models/models"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { JobPartnersGuardrailError } from "./jobs-partners-guardrails"

// En dessous de ce ratio par rapport au lot précédent, l'import passe mais on veut le savoir ; le blocage se fait à
// l'annulation (cf. cancelRemovedJobsPartners), seule étape qui retire des offres.
const SUSPICIOUS_SHRINK_RATIO = 0.5

type RawImport = {
  destinationCollection: CollectionName
  /** `createdAt` posé sur chaque document du lot en cours : il distingue le nouveau lot du précédent. */
  importDate: Date
  importName: string
}

export const discardRawImport = async ({ destinationCollection, importDate, importName }: RawImport) => {
  const { deletedCount } = await getDbCollection(destinationCollection).deleteMany({ createdAt: importDate })
  logger.info({ deletedCount, destinationCollection }, `import ${importName} annulé : les données précédentes sont conservées`)
}

/**
 * Remplace le lot précédent par le lot en cours une fois celui-ci lu en entier. Un lot vide fait échouer l'import
 * et conserve le lot précédent : un flux vide ou illisible ne doit pas vider la collection raw.
 */
export const commitRawImport = async ({ insertedCount, ...rawImport }: RawImport & { insertedCount: number }) => {
  const { destinationCollection, importDate, importName } = rawImport
  const previousCount = await getDbCollection(destinationCollection).countDocuments({ createdAt: { $ne: importDate } })
  if (insertedCount === 0) {
    await discardRawImport(rawImport)
    throw new JobPartnersGuardrailError(
      `import ${importName} : aucune offre importée, les ${previousCount} offres de l'import précédent sont conservées (${destinationCollection})`
    )
  }

  const { deletedCount } = await getDbCollection(destinationCollection).deleteMany({ createdAt: { $ne: importDate } })
  logger.info({ deletedCount, insertedCount, destinationCollection }, `import ${importName} : lot précédent remplacé`)

  if (previousCount > 0 && insertedCount < previousCount * SUSPICIOUS_SHRINK_RATIO) {
    const shrinkError = internal(
      `import ${importName} : le nombre d'offres a chuté de plus de ${Math.round((1 - SUSPICIOUS_SHRINK_RATIO) * 100)}% par rapport à l'import précédent`,
      {
        destinationCollection,
        previousCount,
        insertedCount,
      }
    )
    logger.error(shrinkError.data, shrinkError.message)
    sentryCaptureException(shrinkError)
  }
}
