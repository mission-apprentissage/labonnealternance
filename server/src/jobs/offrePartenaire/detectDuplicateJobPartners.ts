import { groupBy } from "lodash-es"
import { ObjectId } from "mongodb"
import { oleoduc, writeData } from "oleoduc"
import { RECRUITER_STATUS } from "shared/constants"
import { IJob, JOB_STATUS } from "shared/models"
import jobsPartnersComputedModel, { IComputedJobPartnersDuplicateRef, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import recruiterModel, { IRecruiter } from "shared/models/recruiter.model"
import { removeAccents } from "shared/utils"
import * as stringSimilarity from "string-similarity"

import { logger } from "@/common/logger"
import { getPairs } from "@/common/utils/array"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

// champs utilisés pour les projections
const fieldsRead = ["_id", "partner_label", "offer_title", "duplicates"] as const satisfies (keyof IComputedJobsPartners)[]
const recruiterFieldsRead = ["_id", "status"] as const satisfies (keyof IRecruiter)[]
const jobFieldsRead = ["_id", "rome_appellation_label", "job_status"] as const satisfies (keyof IJob)[]

const FAKE_RECRUITERS_JOB_PARTNER = "recruiters"

type ReadFields = (typeof fieldsRead)[number]
type RecruiterFields = (typeof recruiterFieldsRead)[number]
type JobFields = (typeof jobFieldsRead)[number]

type TreatedDocument = Pick<IComputedJobsPartners, ReadFields>
type ProjectedIRecruiter = Pick<IRecruiter, RecruiterFields> & { jobs: Pick<IJob, JobFields>[] }
type AggregationResult = {
  _id: string
  documents: TreatedDocument[]
  recruiters?: ProjectedIRecruiter[]
}

export const detectDuplicateJobPartners = async () => {
  await getDbCollection("computed_jobs_partners").updateMany({}, { $set: { duplicates: [] } })
  const jobPartnerFields: (keyof IComputedJobsPartners)[] = ["workplace_siret", "workplace_brand", "workplace_legal_name", "workplace_name"]
  const jobPartnerVsRecruiterFields: { jobPartnerField: keyof IComputedJobsPartners; recruiterField: keyof IRecruiter }[] = [
    { jobPartnerField: "workplace_siret", recruiterField: "establishment_siret" },
    { jobPartnerField: "workplace_brand", recruiterField: "establishment_enseigne" },
    { jobPartnerField: "workplace_legal_name", recruiterField: "establishment_raison_sociale" },
    { jobPartnerField: "workplace_name", recruiterField: "establishment_raison_sociale" },
    { jobPartnerField: "workplace_name", recruiterField: "establishment_enseigne" },
  ]
  await asyncForEach(jobPartnerFields, (field) => detectDuplicateJobPartnersFactory(field, jobPartnerStreamFactory(field)))
  await asyncForEach(jobPartnerVsRecruiterFields, (field) =>
    detectDuplicateJobPartnersFactory(field.jobPartnerField, jobPartnerVsRecruiterStreamFactory(field.jobPartnerField, field.recruiterField))
  )
}

const jobPartnerStreamFactory = (groupField: keyof IComputedJobsPartners) => {
  logger.info(`début de detectDuplicateJobPartners groupé par le champ ${groupField}`)
  return getDbCollection("computed_jobs_partners")
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
    .stream()
}

const jobPartnerVsRecruiterStreamFactory = (jobPartnerField: keyof IComputedJobsPartners, recruiterField: keyof IRecruiter) => {
  logger.info(`début de detectDuplicateJobPartners entre computedJobPartners et recruiters, pour les champs jobPartnerField=${jobPartnerField} et recruiterField=${recruiterField}`)
  return getDbCollection("computed_jobs_partners")
    .aggregate([
      { $group: { _id: `$${jobPartnerField}`, documents: { $push: "$$ROOT" } } },
      { $match: { _id: { $ne: null } } },
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
      {
        $lookup: {
          from: recruiterModel.collectionName,
          foreignField: recruiterField,
          localField: "_id",
          as: "recruiters",
        },
      },
      {
        $project: {
          _id: 1,
          documents: 1,
          recruiters: {
            $map: {
              input: "$recruiters",
              as: "recruiter",
              in: {
                ...Object.fromEntries(recruiterFieldsRead.map((field) => [field, `$$recruiter.${field}`])),
                jobs: {
                  $map: {
                    input: "$$recruiter.jobs",
                    as: "job",
                    in: Object.fromEntries(jobFieldsRead.map((field) => [field, `$$job.${field}`])),
                  },
                },
              },
            },
          },
        },
      },
    ])
    .stream()
}

const detectDuplicateJobPartnersFactory = async (groupField: keyof IComputedJobsPartners, documentStream: AsyncIterable<TreatedDocument>) => {
  let duplicateCount = 0
  let maxOfferPairCount = 0
  let offerPairCount = 0

  await oleoduc(
    documentStream,
    writeData(async (aggregationResult: AggregationResult) => {
      const convertedRecruiters: TreatedDocument[] = (aggregationResult?.recruiters ?? []).flatMap((recruiter) => {
        const { jobs, status } = recruiter
        if (status !== RECRUITER_STATUS.ACTIF) {
          return []
        }
        return jobs.flatMap((job) => {
          const { _id, rome_appellation_label, job_status } = job
          if (job_status !== JOB_STATUS.ACTIVE) {
            return []
          }
          const mapped: TreatedDocument = {
            _id,
            partner_label: FAKE_RECRUITERS_JOB_PARTNER,
            offer_title: rome_appellation_label,
          }
          return [mapped]
        })
      })
      const partnerGroups: TreatedDocument[][] = Object.values(groupBy([...aggregationResult.documents, ...convertedRecruiters], (document) => document.partner_label))
      if (partnerGroups.length < 2) {
        return
      }
      const groupPairs: [TreatedDocument[], TreatedDocument[]][] = getPairs(partnerGroups)
      const offerPairs: [TreatedDocument, TreatedDocument][] = groupPairs.flatMap(([partnerGroup, otherGroup]) =>
        partnerGroup.flatMap((offer) =>
          otherGroup.flatMap<[TreatedDocument, TreatedDocument]>((offer2) => {
            if (offer.duplicates?.some(({ otherOfferId }) => otherOfferId.equals(offer2._id)) || offer2.duplicates?.some(({ otherOfferId }) => otherOfferId.equals(offer._id))) {
              return []
            }
            return [[offer, offer2]]
          })
        )
      )
      maxOfferPairCount = Math.max(maxOfferPairCount, offerPairs.length)
      offerPairCount += offerPairs.length
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
          return [...duplicateInfosToMongoUpdates(treatedDocumentToOfferRef(offer1), treatedDocumentToOfferRef(offer2), reasons)]
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
    offerPairCount,
  })
  return {
    duplicateCount,
    maxOfferPairCount,
    offerPairCount,
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

type OfferRef = {
  _id: ObjectId
  collectionName: IComputedJobPartnersDuplicateRef["collectionName"]
}

const treatedDocumentToOfferRef = (doc: TreatedDocument): OfferRef => {
  return {
    _id: doc._id,
    collectionName: doc.partner_label === FAKE_RECRUITERS_JOB_PARTNER ? recruiterModel.collectionName : jobsPartnersComputedModel.collectionName,
  }
}

const duplicateInfosToMongoUpdates = (offer1: OfferRef, offer2: OfferRef, reasons: string[]) => {
  const reason = reasons.join(", ")
  const duplicateObject1: IComputedJobPartnersDuplicateRef = {
    otherOfferId: offer2._id,
    collectionName: offer2.collectionName,
    reason,
  }
  const duplicateObject2: IComputedJobPartnersDuplicateRef = {
    otherOfferId: offer1._id,
    collectionName: offer1.collectionName,
    reason,
  }
  return [
    offer1.collectionName === jobsPartnersComputedModel.collectionName
      ? {
          updateOne: {
            filter: { _id: offer1._id },
            update: { $push: { duplicates: duplicateObject1 } },
          },
        }
      : null,
    offer2.collectionName === jobsPartnersComputedModel.collectionName
      ? {
          updateOne: {
            filter: { _id: offer2._id },
            update: { $push: { duplicates: duplicateObject2 } },
          },
        }
      : null,
  ].flatMap((x) => (x ? [x] : []))
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
