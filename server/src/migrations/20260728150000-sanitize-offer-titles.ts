import type { AnyBulkWriteOperation } from "mongodb"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { ISearchItem } from "shared/models/searchItems.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sanitizeToPlainText } from "@/common/utils/string-utils"

/**
 * Les titres d'offres sont désormais stockés en texte brut (tags strippés, entités décodées —
 * cf. `sanitizeToPlainText`) : côté `search_items` pour le rendu en children React du nouveau
 * moteur, et côté `jobs_partners` pour les offres LBA dont `offer_title_custom` (saisie libre
 * recruteur) n'était pas sanitizé à la source alors que la page détail et les cartes SEO
 * rendent le titre en innerHTML. Les flux partenaires et l'API passent déjà par
 * `formatTextFieldsJobsPartners` — seuls les titres `offres_emploi_lba` sont réécrits ici.
 * L'index Atlas Search se resynchronise automatiquement sur les documents modifiés.
 */

// Seuls les titres contenant & < ou > peuvent changer après strip + décodage.
const DIRTY_TITLE = /[&<>]/

const sanitizeSearchItemsTitles = async (): Promise<string> => {
  const collection = getDbCollection("search_items")
  const cursor = collection.find({ title: DIRTY_TITLE }, { projection: { _id: 1, title: 1 } })

  let scanned = 0
  let updated = 0
  let batch: AnyBulkWriteOperation<ISearchItem>[] = []

  const flushBatch = async () => {
    if (!batch.length) return
    const result = await collection.bulkWrite(batch, { ordered: false })
    updated += result.modifiedCount
    batch = []
  }

  for await (const doc of cursor) {
    scanned++
    const plainTitle = sanitizeToPlainText(doc.title ?? "")
    if (plainTitle !== doc.title) {
      batch.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { title: plainTitle } } } })
    }
    if (batch.length >= 1000) await flushBatch()
  }
  await flushBatch()

  return `search_items ${updated}/${scanned} réécrits`
}

const sanitizeLbaOfferTitles = async (): Promise<string> => {
  const collection = getDbCollection("jobs_partners")
  const cursor = collection.find({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_title: DIRTY_TITLE }, { projection: { _id: 1, offer_title: 1 } })

  let scanned = 0
  let updated = 0
  let batch: AnyBulkWriteOperation<IJobsPartnersOfferPrivate>[] = []

  const flushBatch = async () => {
    if (!batch.length) return
    const result = await collection.bulkWrite(batch, { ordered: false })
    updated += result.modifiedCount
    batch = []
  }

  for await (const doc of cursor) {
    scanned++
    const plainTitle = sanitizeToPlainText(doc.offer_title ?? "")
    if (plainTitle !== doc.offer_title) {
      batch.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { offer_title: plainTitle } } } })
    }
    if (batch.length >= 1000) await flushBatch()
  }
  await flushBatch()

  return `jobs_partners (offres LBA) ${updated}/${scanned} réécrits`
}

export const up = async () => {
  const searchItemsReport = await sanitizeSearchItemsTitles()
  const jobsPartnersReport = await sanitizeLbaOfferTitles()
  logger.info(`sanitize-offer-titles: ${searchItemsReport}, ${jobsPartnersReport}`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
