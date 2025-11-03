import { JOB_STATUS_ENGLISH } from "shared"
import jobsPartnersModel, { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import seoVilleModel from "shared/models/seoVille.model"

import { getDbCollection } from "@/common/utils/mongodbUtils.js"
import { getPartnerJobsCount } from "@/services/jobs/jobOpportunity/jobOpportunity.service"

export const getSeoVille = async ({ ville }: { ville: string }) => {
  const seoVille = await getDbCollection(seoVilleModel.collectionName).findOne({ slug: ville })
  console.log("seoVille", ville, seoVille)
  return seoVille
}

export const updateSeoVilleJobCounts = async () => {
  const villes = await getDbCollection(seoVilleModel.collectionName).find({}).toArray()

  for (const ville of villes) {
    //const jobCounts = await getDbCollection("jobs_partners").find()
    const jobCount = await getPartnerJobsCount({
      latitude: ville.geopoint.lat,
      longitude: ville.geopoint.long,
      radius: 30,
      partnerLabel: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      includePartnerLabel: false,
    })

    const recruteurCount = await getPartnerJobsCount({
      latitude: ville.geopoint.lat,
      longitude: ville.geopoint.long,
      radius: 30,
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
            maxDistance: 30 * 1000,
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
            _id: {
              workplace_naf_label: "$workplace_naf_label",
              offer_rome_codes: "$offer_rome_codes",
            },
            count: {
              $sum: 1,
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
            naf_label: "$_id.workplace_naf_label",
            rome_codes: "$_id.offer_rome_codes",
            _id: 0,
          },
        },
      ])
      .toArray()

    await getDbCollection(seoVilleModel.collectionName).updateOne(
      { _id: ville._id },
      {
        $set: {
          "content.vie.activites": activities,
        },
      }
    )
  }
}
