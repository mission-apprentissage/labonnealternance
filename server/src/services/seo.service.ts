import { JOB_STATUS_ENGLISH } from "shared"
import jobsPartnersModel, { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import seoVilleModel from "shared/models/seoVille.model"
import seoMetierModel from "shared/models/seoMetier.model"

import { getPartnerJobsCount } from "./jobs/jobOpportunity/jobOpportunity.service"
import { getDbCollection } from "@/common/utils/mongodbUtils.js"
import { asyncForEach } from "@/common/utils/asyncUtils"

const DEFAULT_RADIUS_KM = 30

export const getSeoVille = async ({ ville }: { ville: string }) => {
  const seoVille = await getDbCollection(seoVilleModel.collectionName).findOne({ slug: ville })
  return seoVille
}

export const updateSeoVilleJobCounts = async () => {
  const villes = await getDbCollection(seoVilleModel.collectionName).find({}).toArray()

  for (const ville of villes) {
    const jobCount = await getPartnerJobsCount({
      latitude: ville.geopoint.lat,
      longitude: ville.geopoint.long,
      radius: DEFAULT_RADIUS_KM,
      partnerLabel: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      includePartnerLabel: false,
    })

    const recruteurCount = await getPartnerJobsCount({
      latitude: ville.geopoint.lat,
      longitude: ville.geopoint.long,
      radius: DEFAULT_RADIUS_KM,
      partnerLabel: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      includePartnerLabel: true,
    })

    await getDbCollection(seoVilleModel.collectionName).updateOne(
      { _id: ville._id },
      {
        $set: {
          job_count: jobCount,
          recruteur_count: recruteurCount,
        },
      }
    )
  }
}

export const updateSeoVilleActivities = async () => {
  const villes = await getDbCollection(seoVilleModel.collectionName)
    .find({}, { projection: { _id: 1, slug: 1, geopoint: 1 } })
    .toArray()

  for (const ville of villes) {
    const activities = await getDbCollection(jobsPartnersModel.collectionName)
      .aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [ville.geopoint.long, ville.geopoint.lat] },
            distanceField: "distance",
            maxDistance: DEFAULT_RADIUS_KM * 1000,
            spherical: true,
            query: {
              offer_status: JOB_STATUS_ENGLISH.ACTIVE,
              workplace_naf_label: {
                $ne: null,
              },
            },
          },
        },
        {
          $group: {
            _id: "$workplace_naf_label",
            count: {
              $sum: 1,
            },
            rome_codes: {
              $addToSet: "$offer_rome_codes", // Collects all unique rome_codes
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
        {
          $limit: 5,
        },
        {
          $project: {
            naf_label: "$_id",
            rome_codes: 1,
            _id: 0,
          },
        },
      ])
      .toArray()

    await getDbCollection(seoVilleModel.collectionName).updateOne(
      { _id: ville._id },
      {
        $set: {
          "content.vie.activites": activities.map((activity) => {
            return { naf_label: activity.naf_label, rome_codes: activity.rome_codes.flat() }
          }),
        },
      }
    )
  }
}

export const getSeoMetier = async ({ metier }: { metier: string }) => {
  const seoMetier = await getDbCollection(seoMetierModel.collectionName).findOne({ slug: metier })
  return seoMetier
}

export const updateSeoMetierJobCounts = async () => {
  const metiers = await getDbCollection(seoMetierModel.collectionName).find({}).toArray()
  console.log(metiers)

  await asyncForEach(metiers, async (metier) => {
    const jobCount = await getDbCollection("jobs_partners").countDocuments({ offer_rome_codes: { $in: metier.romes }, offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    console.log(jobCount)

    const companyCountResult = await getDbCollection("jobs_partners")
      .aggregate([
        {
          $match: {
            offer_status: JOB_STATUS_ENGLISH.ACTIVE,
            offer_rome_codes: { $in: metier.romes },
          },
        },
        {
          $group: {
            _id: "$workplace_siret",
          },
        },
        {
          $count: "distinctSirets",
        },
      ])
      .toArray()

    const companyCount = companyCountResult[0]?.distinctSirets || 0

    console.log(companyCount)
  })

  // build applicant_count: 0,
  // build entreprises: [],
  // build formations: [],
  // build villes: [],
  // build cards: [],
}
