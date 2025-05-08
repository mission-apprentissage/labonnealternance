import { ObjectId } from "mongodb"
import { JOB_STATUS } from "shared"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getNearEtablissementsFromRomes } from "@/services/catalogue.service"

export const sendMiseEnRelation = async () => {
  const fromDate = new Date(new Date().setDate(new Date().getDate() - 45))
  const toDate = new Date(new Date().setDate(new Date().getDate() - 5))

  const jobsWihoutEnoughApplications = (await getDbCollection("jobs")
    .aggregate([
      {
        $match: {
          job_creation_date: {
            $gte: fromDate,
            $lte: toDate,
          },
          job_status: JOB_STATUS.ACTIVE,
          $or: [
            {
              job_mer_sent: null,
            },
            {
              job_mer_sent: {
                $exists: false,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "applications",
          localField: "jobId",
          foreignField: "job_id",
          as: "applications",
        },
      },
      {
        $addFields: {
          application_count: {
            $size: "$applications",
          },
        },
      },
      {
        $match: {
          $and: [
            {
              application_count: {
                $lt: 15,
              },
            },
          ],
        },
      },
      {
        $project: {
          jobId: 1,
          application_count: 1,
          first_name: 1,
          last_name: 1,
          email: 1,
          geo_coordinates: 1,
          offer_title_custom: 1,
          rome_appellation_label: 1,
          rome_label: 1,
          rome_code: 1,
        },
      },
    ])
    .toArray()) as {
    jobId: string
    application_count: number
    first_name: string
    last_name: string
    email: string
    geo_coordinates: string
    offer_title_custom: string
    rome_appellation_label: string
    rome_label: string
    rome_code: string[]
  }[]

  await asyncForEach(
    jobsWihoutEnoughApplications,
    async (job: {
      jobId: string
      application_count: number
      first_name: string
      last_name: string
      email: string
      geo_coordinates: string
      offer_title_custom: string
      rome_appellation_label: string
      rome_label: string
      rome_code: string[]
    }) => {
      console.log(job)

      const etablissements = await getNearEtablissementsFromRomes({
        rome: job.rome_code,
        origin: {
          latitude: parseFloat(job.geo_coordinates.split(",")[0]),
          longitude: parseFloat(job.geo_coordinates.split(",")[1]),
        },
        limit: 10,
      })

      console.log("etablissements", etablissements.length)

      if (etablissements.some((etablissement) => etablissement.distance_en_km < 100)) {
        console.log("envoi mail")
        // TODO : envoyer le mail
      }

      const jobId = new ObjectId(job.jobId)
      await getDbCollection("recruiters").updateOne(
        { "jobs._id": jobId },
        {
          $set: {
            "jobs.$[elem].mer_sent": new Date(),
          },
        },
        { arrayFilters: [{ "elem._id": jobId }] }
      )
    }
  )

  /*
    
    au moins 1 CFA correspondant à l'offre

    */
}
