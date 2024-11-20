import { groupBy } from "lodash-es"
import { ObjectId } from "mongodb"
import { oleoduc, writeData } from "oleoduc"
import { IComputedJobPartnersDuplicateRef, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { removeAccents } from "shared/utils"
import * as stringSimilarity from "string-similarity"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const detectDuplicateJobPartners = async () => {
  await getDbCollection("computed_jobs_partners").updateMany({}, { $set: { duplicates: [] } })
  const groupingFields: (keyof IComputedJobsPartners)[] = ["workplace_siret", "workplace_brand", "workplace_legal_name", "workplace_name"]
  await asyncForEach(groupingFields, (field) => detectDuplicateJobPartnersFactory(field))
}

const detectDuplicateJobPartnersFactory = async (groupField: keyof IComputedJobsPartners) => {
  logger.info(`début de detectDuplicateJobPartners groupé par le champ ${groupField}`)

  const fieldsRead = ["_id", "partner_label", "offer_title", groupField] as const satisfies (keyof IComputedJobsPartners)[]

  type ReadField = (typeof fieldsRead)[number]
  type ReadDocument = Pick<IComputedJobsPartners, ReadField>
  type AggregationResult = {
    _id: string
    documents: ReadDocument[]
  }

  let duplicateCount = 0
  let maxOfferPairCount = 0

  await oleoduc(
    getDbCollection("computed_jobs_partners")
      .aggregate([
        { $group: { _id: `$${groupField}`, documents: { $push: "$$ROOT" } } },
        { $match: { _id: { $ne: null }, "documents.1": { $exists: true } } },
        {
          $project: {
            _id: 1,
            documents: {
              $map: {
                input: "$documents",
                as: "document",
                in: Object.fromEntries(fieldsRead.map((field) => [field, `$$document.${field}`])),
              },
            },
          },
        },
      ])
      .stream(),
    writeData(async (group: AggregationResult) => {
      const partnerGroups = Object.values(groupBy(group.documents, (document) => document.partner_label))
      if (partnerGroups.length < 2) {
        return
      }
      const offerPairs = partnerGroups.flatMap((partnerGroup, groupIndex) => {
        const otherGroups = partnerGroups.slice(groupIndex + 1)
        return otherGroups.flatMap((otherGroup) => partnerGroup.flatMap((offer) => otherGroup.map((offer2) => [offer, offer2] as const)))
      })
      maxOfferPairCount = Math.max(maxOfferPairCount, offerPairs.length)
      const updates = offerPairs.flatMap(([offer1, offer2]) => {
        const reasons: string[] = [`identical ${groupField}`]
        const similarityOpt = checkSimilarity(offer1.offer_title, offer2.offer_title)
        if (similarityOpt) {
          reasons.push(`${similarityOpt} offer_title`)
        }
        if (reasons.length <= 1) {
          return []
        } else {
          duplicateCount += 2
          return [...duplicateInfosToMongoUpdates(offer1, offer2, reasons)]
        }
      })
      if (updates.length) {
        await getDbCollection("computed_jobs_partners").bulkWrite(updates, {
          ordered: false,
        })
      }
    })
  )
  logger.info(`fin de detectDuplicateJobPartners groupé par le champ ${groupField}`, {
    duplicateCount,
    maxOfferPairCount,
  })
  return {
    duplicateCount,
    maxOfferPairCount,
  }
}

export const checkSimilarity = (string1: string | null | undefined, string2: string | null | undefined): string | undefined => {
  if (!string1 || !string2) {
    return
  }
  if (string1 === string2) {
    return "identical"
  }
  string1 = cleanForSearch(string1)
  string2 = cleanForSearch(string2)
  if (string1 === string2) {
    return "similar after clean"
  }
  const similarity = stringSimilarity.compareTwoStrings(string1, string2)
  if (similarity >= 0.8) {
    return `similar ${similarity.toFixed(2)}`
  }
}

const duplicateInfosToMongoUpdates = (offer1: { _id: ObjectId }, offer2: { _id: ObjectId }, reasons: string[]) => {
  const reason = reasons.join(", ")
  const duplicateObject1: IComputedJobPartnersDuplicateRef = {
    otherOfferId: offer2._id,
    reason,
  }
  const duplicateObject2: IComputedJobPartnersDuplicateRef = {
    otherOfferId: offer1._id,
    reason,
  }
  return [
    {
      updateOne: {
        filter: { _id: offer1._id },
        update: { $push: { duplicates: duplicateObject1 } },
      },
    },
    {
      updateOne: {
        filter: { _id: offer2._id },
        update: { $push: { duplicates: duplicateObject2 } },
      },
    },
  ]
}

const acronymes = {
  MFR: "maison familiale rurale",
  RH: "ressources humaines",
}
const acronymeEntries = Object.entries(acronymes)

const cleanForSearch = (str: string): string => {
  const words = removeAccents(str)
    .split(/[^a-z]/gi)
    .flatMap((part) => {
      const acronymeEntryOpt = acronymeEntries.find(([acronyme]) => acronyme === part)
      if (acronymeEntryOpt) {
        return acronymeEntryOpt[1].split(" ")
      }
      part = part.toLowerCase()
      return part.length > Math.min(3, str.length / 5) ? [part] : []
    })
  return deduplicateWords(words).join(" ")
}

const deduplicateWords = (words: string[]): string[] => words.filter((word, index) => words.indexOf(word) === index)
