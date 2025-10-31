import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
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
