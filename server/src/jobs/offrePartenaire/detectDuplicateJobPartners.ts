import { groupBy } from "lodash-es"
import { AnyBulkWriteOperation, Filter } from "mongodb"
import { oleoduc, writeData } from "oleoduc"
import { RECRUITER_STATUS } from "shared/constants"
import { IJob, JOB_STATUS, JOB_STATUS_ENGLISH, ZGlobalAddress } from "shared/models"
import jobsPartnersModel, { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import jobsPartnersComputedModel, { IComputedJobPartnersDuplicateRef, IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import recruiterModel, { IRecruiter } from "shared/models/recruiter.model"
import { removeAccents } from "shared/utils"
import * as stringSimilarity from "string-similarity"

import { logger } from "@/common/logger"
import { deduplicate, getPairs } from "@/common/utils/array"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

// champs utilisés pour les projections
const fieldsRead = ["_id", "partner_label", "offer_title", "duplicates", "workplace_address_zipcode", "rank", "created_at"] as const satisfies (keyof IComputedJobsPartners)[]
const recruiterFieldsRead = ["_id", "status", "address_detail", "createdAt"] as const satisfies (keyof IRecruiter)[]
const jobFieldsRead = ["_id", "rome_appellation_label", "job_status"] as const satisfies (keyof IJob)[]

const FAKE_RECRUITERS_JOB_PARTNER = "recruiters"

const recruiterCollection = recruiterModel.collectionName
const jobPartnerCollection = jobsPartnersModel.collectionName
const computedJobPartnerCollection = jobsPartnersComputedModel.collectionName

type ReadFields = (typeof fieldsRead)[number]
type RecruiterFields = (typeof recruiterFieldsRead)[number]
type JobFields = (typeof jobFieldsRead)[number]

type ProjectedComputedJobPartner = Pick<IComputedJobsPartners, ReadFields>
type ProjectedIRecruiter = Pick<IRecruiter, RecruiterFields> & { jobs: Pick<IJob, JobFields>[] }
type ProjectedJobPartner = ProjectedComputedJobPartner & Pick<IJobsPartnersOfferPrivate, "offer_status">

type AggregationResult = {
  _id: string
  documents: ProjectedComputedJobPartner[]
  recruiters?: ProjectedIRecruiter[]
  jobPartners?: ProjectedJobPartner[]
}
type TreatedDocument = ProjectedComputedJobPartner & {
  collectionName: typeof recruiterCollection | typeof jobPartnerCollection | typeof computedJobPartnerCollection
}

export const detectDuplicateJobPartners = async (addedMatchFilter?: Filter<IComputedJobsPartners>) => {
  // @ts-ignore
  const computedJobPartnersFilter: Filter<IComputedJobsPartners> = { $and: [{ business_error: null }, ...(addedMatchFilter ? [addedMatchFilter] : [])] }

  await getDbCollection("computed_jobs_partners").updateMany(computedJobPartnersFilter, { $set: { duplicates: [] } })
  const jobPartnerFields: (keyof IComputedJobsPartners)[] = ["workplace_siret", "workplace_brand", "workplace_legal_name", "workplace_name"]
  const jobPartnerVsRecruiterFields: { jobPartnerField: keyof IComputedJobsPartners; recruiterField: keyof IRecruiter }[] = [
    { jobPartnerField: "workplace_siret", recruiterField: "establishment_siret" },
    { jobPartnerField: "workplace_brand", recruiterField: "establishment_enseigne" },
    { jobPartnerField: "workplace_legal_name", recruiterField: "establishment_raison_sociale" },
    { jobPartnerField: "workplace_name", recruiterField: "establishment_raison_sociale" },
    { jobPartnerField: "workplace_name", recruiterField: "establishment_enseigne" },
  ]
  await asyncForEach(jobPartnerFields, async (groupField) => {
    const { duplicateCount, maxOfferPairCount, offerPairCount } = await detectDuplicateJobPartnersFactory(
      groupField,
      computedJobPartnerStreamFactory(groupField, computedJobPartnersFilter)
    )
    const message = `detectDuplicateJobPartners: VS computed_job_partners: groupé par le champ ${groupField}. duplicateCount=${duplicateCount}, maxOfferPairCount=${maxOfferPairCount}, offerPairCount=${offerPairCount}`
    logger.info(message)
    await notifyToSlack({
      subject: `Détection des offres en doublon`,
      message,
      error: false,
    })
  })
  await asyncForEach(jobPartnerVsRecruiterFields, async ({ jobPartnerField, recruiterField }) => {
    const { duplicateCount, maxOfferPairCount, offerPairCount } = await detectDuplicateJobPartnersFactory(
      jobPartnerField,
      computedJobPartnerVsRecruiterStreamFactory(jobPartnerField, recruiterField, computedJobPartnersFilter)
    )
    const message = `detectDuplicateJobPartners: VS recruiters: groupé par le champ computed_jobs_partners.${jobPartnerField} VS recruiters.${recruiterField}. duplicateCount=${duplicateCount}, maxOfferPairCount=${maxOfferPairCount}, offerPairCount=${offerPairCount}`
    logger.info(message)
    await notifyToSlack({
      subject: `Détection des offres en doublon`,
      message,
      error: false,
    })
  })
  await asyncForEach(jobPartnerFields, async (groupField) => {
    const { duplicateCount, maxOfferPairCount, offerPairCount } = await detectDuplicateJobPartnersFactory(
      groupField,
      computedJobPartnerVsJobPartnerStreamFactory(groupField, computedJobPartnersFilter)
    )
    const message = `detectDuplicateJobPartners: VS job_partners: groupé par le champ ${groupField}. duplicateCount=${duplicateCount}, maxOfferPairCount=${maxOfferPairCount}, offerPairCount=${offerPairCount}`
    logger.info(message)
    await notifyToSlack({
      subject: `Détection des offres en doublon`,
      message,
      error: false,
    })
  })
}

const computedJobPartnerStreamFactory = (groupField: keyof IComputedJobsPartners, computedJobPartnersFilter: Filter<IComputedJobsPartners>) => {
  logger.info(`début de detectDuplicateJobPartners groupé par le champ ${groupField}`)
  return getDbCollection("computed_jobs_partners")
    .aggregate([
      { $match: computedJobPartnersFilter },
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

const computedJobPartnerVsRecruiterStreamFactory = (
  computedJobPartnerField: keyof IComputedJobsPartners,
  recruiterField: keyof IRecruiter,
  computedJobPartnersFilter: Filter<IComputedJobsPartners>
) => {
  logger.info(
    `début de detectDuplicateJobPartners entre computedJobPartners et recruiters, pour les champs computedJobPartnerField=${computedJobPartnerField} et recruiterField=${recruiterField}`
  )
  return getDbCollection("computed_jobs_partners")
    .aggregate([
      { $match: computedJobPartnersFilter },
      { $group: { _id: `$${computedJobPartnerField}`, documents: { $push: "$$ROOT" } } },
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
          from: recruiterCollection,
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

const computedJobPartnerVsJobPartnerStreamFactory = (computedJobPartnerField: keyof IComputedJobsPartners, computedJobPartnersFilter: Filter<IComputedJobsPartners>) => {
  logger.info(
    `début de detectDuplicateJobPartners entre computedJobPartners et jobPartners, pour les champs computedJobPartnerField=${computedJobPartnerField} et jobPartnerField=${computedJobPartnerField}`
  )
  return getDbCollection("computed_jobs_partners")
    .aggregate([
      { $match: computedJobPartnersFilter },
      { $group: { _id: `$${computedJobPartnerField}`, documents: { $push: "$$ROOT" } } },
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
          from: jobPartnerCollection,
          foreignField: computedJobPartnerField,
          localField: "_id",
          as: "jobPartners",
        },
      },
      {
        $project: {
          _id: 1,
          documents: 1,
          jobPartners: {
            $map: {
              input: "$jobPartners",
              as: "jobPartner",
              in: Object.fromEntries([...fieldsRead, "offer_status"].map((field) => [field, `$$jobPartner.${field}`])),
            },
          },
        },
      },
    ])
    .stream()
}

const detectDuplicateJobPartnersFactory = async (groupField: keyof IComputedJobsPartners, documentStream: AsyncIterable<ProjectedComputedJobPartner>) => {
  let duplicateCount = 0
  let maxOfferPairCount = 0
  let offerPairCount = 0

  await oleoduc(
    documentStream,
    writeData(async (aggregationResult: AggregationResult) => {
      const convertedRecruiters: TreatedDocument[] = (aggregationResult?.recruiters ?? []).flatMap((recruiter) => {
        const { jobs, status, address_detail, createdAt } = recruiter
        if (status !== RECRUITER_STATUS.ACTIF) {
          return []
        }
        const parsedAddress = ZGlobalAddress.safeParse(address_detail)
        return jobs.flatMap((job) => {
          const { _id, rome_appellation_label, job_status } = job
          if (job_status !== JOB_STATUS.ACTIVE) {
            return []
          }
          const mapped: TreatedDocument = {
            _id,
            collectionName: recruiterCollection,
            partner_label: FAKE_RECRUITERS_JOB_PARTNER,
            offer_title: rome_appellation_label,
            workplace_address_zipcode: parsedAddress.data?.code_postal || null,
            created_at: createdAt,
          }
          return [mapped]
        })
      })
      const partnerGroups: TreatedDocument[][] = Object.values(
        groupBy(
          [
            ...aggregationResult.documents.map((props) => ({ ...props, collectionName: computedJobPartnerCollection })),
            ...convertedRecruiters,
            ...(aggregationResult.jobPartners ?? []).flatMap((props) =>
              props.offer_status === JOB_STATUS_ENGLISH.ACTIVE ? [{ ...props, collectionName: jobPartnerCollection }] : []
            ),
          ],
          (document) => document.partner_label
        )
      )
      if (partnerGroups.length < 2) {
        return
      }
      const groupPairs: [TreatedDocument[], TreatedDocument[]][] = getPairs(partnerGroups)
      const offerPairs: [TreatedDocument, TreatedDocument][] = groupPairs.flatMap(([partnerGroup, otherGroup]) =>
        partnerGroup.flatMap((offer) =>
          otherGroup.flatMap<[TreatedDocument, TreatedDocument]>((offer2) => {
            if (isFlaggedDuplicateOf(offer, offer2) || isFlaggedDuplicateOf(offer2, offer) || offer._id.equals(offer2._id)) {
              return []
            }
            return [[offer, offer2]]
          })
        )
      )
      maxOfferPairCount = Math.max(maxOfferPairCount, offerPairs.length)
      offerPairCount += offerPairs.length
      const updates = offerPairs.flatMap(([offer1, offer2]) => {
        if (offer1.workplace_address_zipcode !== offer2.workplace_address_zipcode) {
          return []
        }
        const reasons: string[] = [`identical ${groupField}`]
        const similarityOpt = checkSimilarity(offer1.offer_title, offer2.offer_title)
        if (similarityOpt) {
          reasons.push(`${similarityOpt} offer_title`)
        }
        if (reasons.length <= 1) {
          return []
        } else {
          duplicateCount += 2
          return [duplicateInfosToMongoUpdates(offer1, offer2, reasons)]
        }
      })
      const reducedUpdates = reduceDbUpdates(updates)
      const { computedJobPartnerOperations, jobPartnerOperations } = reducedUpdates
      if (computedJobPartnerOperations.length) {
        await getDbCollection("computed_jobs_partners").bulkWrite(computedJobPartnerOperations, {
          ordered: false,
        })
      }
      if (jobPartnerOperations.length) {
        await getDbCollection("jobs_partners").bulkWrite(jobPartnerOperations, {
          ordered: false,
        })
      }
    })
  )
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

export type OfferRef = Pick<TreatedDocument, "rank" | "collectionName" | "created_at">

// in case of duplicates, returns true if offer1 is selected over offer2
export const isCanonicalForDuplicate = (offer1: OfferRef, offer2: OfferRef) => {
  if (offer1.collectionName !== offer2.collectionName) {
    if (offer1.collectionName === recruiterCollection) return true
    if (offer2.collectionName === recruiterCollection) return false
  }
  const rank1 = offer1.rank ?? 0
  const rank2 = offer2.rank ?? 0
  if (rank1 !== rank2) {
    return rank1 >= rank2
  }
  return offer1.created_at.getTime() <= offer2.created_at.getTime()
}

type ComputedJobPartnerOperation = AnyBulkWriteOperation<IComputedJobsPartners>
type JobPartnerOperation = AnyBulkWriteOperation<IJobsPartnersOfferPrivate>
type DbUpdate = { computedJobPartnerOperations: ComputedJobPartnerOperation[]; jobPartnerOperations: JobPartnerOperation[] }

const duplicateInfosToMongoUpdates = (offer1: TreatedDocument, offer2: TreatedDocument, reasons: string[]): DbUpdate => {
  const reason = reasons.join(", ")
  const duplicateObjectForOffer1: IComputedJobPartnersDuplicateRef = {
    otherOfferId: offer2._id,
    collectionName: offer2.collectionName,
    reason,
  }
  const duplicateObjectForOffer2: IComputedJobPartnersDuplicateRef = {
    otherOfferId: offer1._id,
    collectionName: offer1.collectionName,
    reason,
  }
  const isOffer1canonical = isCanonicalForDuplicate(offer1, offer2)
  const update1 = buildOperationsForASingleOffer(offer1, duplicateObjectForOffer1, isOffer1canonical)
  const update2 = buildOperationsForASingleOffer(offer2, duplicateObjectForOffer2, !isOffer1canonical)
  return reduceDbUpdates([update1, update2])
}

const reduceDbUpdates = (updates: DbUpdate[]): DbUpdate => {
  return updates.reduce(
    ({ computedJobPartnerOperations, jobPartnerOperations }, { computedJobPartnerOperations: computedJobPartnerOperations2, jobPartnerOperations: jobPartnerOperations2 }) => ({
      computedJobPartnerOperations: [...computedJobPartnerOperations, ...computedJobPartnerOperations2],
      jobPartnerOperations: [...jobPartnerOperations, ...jobPartnerOperations2],
    }),
    { computedJobPartnerOperations: [], jobPartnerOperations: [] }
  )
}

const buildOperationsForASingleOffer = (offer: TreatedDocument, otherOfferDuplicateObject: IComputedJobPartnersDuplicateRef, isCanonical: boolean): DbUpdate => {
  const computedJobPartnerOperations: ComputedJobPartnerOperation[] = []
  const jobPartnerOperations: JobPartnerOperation[] = []
  if (offer.collectionName === computedJobPartnerCollection) {
    computedJobPartnerOperations.push({
      updateOne: {
        filter: { _id: offer._id },
        update: { $push: { duplicates: otherOfferDuplicateObject } },
      },
    })
    if (!isCanonical) {
      computedJobPartnerOperations.push({
        updateOne: {
          filter: { _id: offer._id },
          update: { $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.DUPLICATE } },
        },
      })
    }
  } else if (offer.collectionName === jobPartnerCollection && !isCanonical) {
    jobPartnerOperations.push({
      updateOne: {
        filter: { _id: offer._id },
        update: { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE } },
      },
    })
    jobPartnerOperations.push({
      updateOne: {
        filter: { _id: offer._id },
        update: {
          $push: {
            offer_status_history: {
              date: new Date(),
              status: JOB_STATUS_ENGLISH.ANNULEE,
              reason: `détectée comme doublon, remplacée par ${JSON.stringify(otherOfferDuplicateObject)}`,
              granted_by: "détecteur de doublons",
            },
          },
        },
      },
    })
  }
  return { computedJobPartnerOperations, jobPartnerOperations }
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
  return deduplicate(words).join(" ")
}

const isFlaggedDuplicateOf = (doc1: TreatedDocument, doc2: TreatedDocument): boolean => Boolean(doc1.duplicates?.some(({ otherOfferId }) => otherOfferId.equals(doc2._id)))
